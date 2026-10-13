import { Boom } from '@hapi/boom'
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  COUNTDOWN_GROUP_JID,
  getCountdownSubject,
} from './countdown.js'

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_MS = 2_000

type CliOptions = {
  groupJid: string
  subject: string
}

type Socket = ReturnType<typeof makeWASocket>
type SocketAction = (socket: Socket) => Promise<void>

class CliError extends Error {}

function parseArgs(args: string[]): CliOptions {
  if (args.length !== 2) {
    throw new CliError(
      'Uso: npm run rename-group -- "<group-jid>" "<novo-nome>"',
    )
  }

  const groupJid = args[0].trim()
  const subject = args[1].trim()

  if (!/^[^@\s]+@g\.us$/.test(groupJid)) {
    throw new CliError(
      `JID de grupo inválido: "${groupJid}". O formato esperado termina com @g.us.`,
    )
  }

  if (!subject) {
    throw new CliError('O novo nome do grupo não pode estar vazio.')
  }

  return { groupJid, subject }
}

function getAuthDirectory(): string {
  const configuredDirectory = process.env.BAILEYS_AUTH_DIR?.trim()
  return resolve(configuredDirectory || '.auth/baileys')
}

function getDisconnectStatusCode(error: unknown): number | undefined {
  if (error instanceof Boom) {
    return error.output.statusCode
  }

  if (error && typeof error === 'object' && 'output' in error) {
    const output = (error as { output?: { statusCode?: unknown } }).output
    return typeof output?.statusCode === 'number' ? output.statusCode : undefined
  }

  return undefined
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

async function closeSocket(socket: Socket): Promise<void> {
  try {
    await socket.ws.close()
  } catch {
    // A socket that is already closed does not need additional handling.
  }
}

async function withWhatsAppSocket(action: SocketAction): Promise<void> {
  const authDirectory = getAuthDirectory()
  let authState = await useMultiFileAuthState(authDirectory)

  let reconnectAttempts = 0
  let actionStarted = false
  let finished = false

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const connect = () => {
      reconnectAttempts += 1
      const socket = makeWASocket({
        auth: authState.state,
        markOnlineOnConnect: false,
      })

      socket.ev.on('creds.update', authState.saveCreds)
      socket.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
          console.log('\nEscaneie este QR em WhatsApp > Dispositivos conectados:\n')
          qrcode.generate(qr, { small: true })
        }

        if (connection === 'open' && !actionStarted) {
          actionStarted = true

          void (async () => {
            try {
              await action(socket)

              finished = true
              await closeSocket(socket)
              resolvePromise()
            } catch (error) {
              finished = true
              await closeSocket(socket)
              rejectPromise(error)
            }
          })()
        }

        if (connection === 'close' && !finished) {
          const statusCode = getDisconnectStatusCode(lastDisconnect?.error)

          const sessionIsInvalid =
            statusCode === DisconnectReason.loggedOut ||
            statusCode === DisconnectReason.badSession

          if (sessionIsInvalid) {
            void (async () => {
              try {
                await rm(authDirectory, { recursive: true, force: true })
                authState = await useMultiFileAuthState(authDirectory)
                reconnectAttempts = 0

                console.log(
                  'A sessão é inválida. Credenciais removidas; um novo QR será exibido.',
                )
                connect()
              } catch (error) {
                finished = true
                rejectPromise(error)
              }
            })()
            return
          }

          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            finished = true
            rejectPromise(
              new Error(
                `Não foi possível conectar ao WhatsApp após ${MAX_RECONNECT_ATTEMPTS} tentativas.`,
              ),
            )
            return
          }

          console.error(
            `Conexão encerrada. Tentando novamente (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`,
          )
          setTimeout(connect, RECONNECT_DELAY_MS)
        }
      })
    }

    connect()
  })
}

async function renameGroup(options: CliOptions): Promise<void> {
  await withWhatsAppSocket(async socket => {
    const metadata = await socket.groupMetadata(options.groupJid)
    console.log(`Nome atual: ${metadata.subject}`)

    if (metadata.subject === options.subject) {
      console.log('O grupo já possui o nome informado.')
      return
    }

    await socket.groupUpdateSubject(options.groupJid, options.subject)
    console.log(`Nome atualizado para: ${options.subject}`)
  })
}

async function updateCountdown(): Promise<void> {
  await renameGroup({
    groupJid: COUNTDOWN_GROUP_JID,
    subject: getCountdownSubject(),
  })
}

async function listGroups(): Promise<void> {
  await withWhatsAppSocket(async socket => {
    const groups = Object.values(await socket.groupFetchAllParticipating())
      .sort((left, right) => left.subject.localeCompare(right.subject))

    if (groups.length === 0) {
      console.log('Nenhum grupo encontrado para esta conta.')
      return
    }

    console.log(`Grupos encontrados: ${groups.length}\n`)
    for (const group of groups) {
      console.log(`${group.subject} -> ${group.id}`)
    }
  })
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args[0] === 'list-groups') {
    if (args.length !== 1) {
      throw new CliError('Uso: npm run list-groups')
    }

    await listGroups()
    return
  }

  if (args[0] === 'update-countdown') {
    if (args.length !== 1) {
      throw new CliError('Uso: npm run update-countdown')
    }

    await updateCountdown()
    return
  }

  const options = parseArgs(args)
  await renameGroup(options)
}

main().catch(error => {
  console.error(`Erro: ${formatError(error)}`)
  process.exitCode = 1
})
