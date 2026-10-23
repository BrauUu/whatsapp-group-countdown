# Atualizador de nome de grupo do WhatsApp

Script de execução única para atualizar o nome de um grupo usando Baileys.

## Requisitos

- Node.js 20 ou superior;
- uma conta do WhatsApp que participe do grupo e possa alterar as configurações dele.

## Instalação

```bash
npm install
```

## Uso

Execute passando o JID do grupo e o novo nome:

```bash
npm run rename-group -- "123456789-123456@g.us" "Novo nome do grupo"
```

Para listar todos os grupos da conta e descobrir seus JIDs:

```bash
npm run list-groups
```

O resultado será exibido no formato `Nome do grupo -> JID`. O JID deve terminar com `@g.us`.

Na primeira execução, um QR será exibido no terminal. No celular, abra **WhatsApp > Configurações > Dispositivos conectados > Conectar dispositivo** e escaneie o código. A sessão será salva em `.auth/baileys` e reutilizada nas próximas execuções.

Para usar outro diretório de sessão:

```bash
BAILEYS_AUTH_DIR="/caminho/para/sessao" npm run rename-group -- "123456789-123456@g.us" "Novo nome"
```

O mesmo diretório de sessão é usado para listar grupos:

```bash
BAILEYS_AUTH_DIR="/caminho/para/sessao" npm run list-groups
```

## Atualização diária pelo cron

O comando abaixo calcula a quantidade de dias restantes até 19/11/2026 e atualiza o grupo `120363414129535932@g.us`:

```bash
npm run update-countdown
```

Para configurar a execução automática no servidor, torne o script executável:

```bash
chmod +x scripts/update-countdown-cron.sh
```

Depois, abra o crontab do usuário que executará o bot:

```bash
crontab -e
```

Adicione esta linha, substituindo `/caminho/para` pelo caminho real do projeto:

```cron
CRON_TZ=America/Sao_Paulo
0 0 * * * /caminho/para/wpp-bot-gta-vi-date/scripts/update-countdown-cron.sh >> /tmp/wpp-bot-gta-vi-date.log 2>&1
```

O script usa a sessão persistente em `.auth/baileys`, impede execuções simultâneas e encerra após atualizar o grupo.

### Preparar a sessão

Na primeira vez, execute `npm run update-countdown` manualmente no servidor e conclua a autenticação pelo QR Code em **WhatsApp > Configurações > Dispositivos conectados > Conectar dispositivo**. A sessão será salva em `.auth/baileys` e reutilizada pelo cron.

Não compartilhe nem versione a pasta `.auth/baileys`: ela contém as credenciais do dispositivo conectado.

## Verificação

```bash
npm run typecheck
```

O processo encerra depois que a alteração é concluída. A conta precisa ter permissão para alterar o nome do grupo; caso contrário, o comando exibirá o erro retornado pelo WhatsApp e terminará com código de falha.
