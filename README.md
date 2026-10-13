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

## Atualização diária pelo GitHub Actions

O comando abaixo calcula a quantidade de dias restantes até 19/11/2026 e atualiza o grupo `120363414129535932@g.us`:

```bash
npm run update-countdown
```

O workflow [`.github/workflows/update-countdown.yml`](.github/workflows/update-countdown.yml) executa esse comando diariamente à meia-noite no fuso `America/Sao_Paulo`. Também é possível executá-lo manualmente pela aba **Actions** do repositório.

### Preparar a sessão segura

Na primeira vez, execute o comando manualmente em um terminal. Escaneie o QR Code pelo WhatsApp em **Configurações > Dispositivos conectados > Conectar dispositivo**. A sessão será salva em `.auth/baileys`.

Depois, gere o arquivo cifrado da sessão:

```bash
bash scripts/create-baileys-auth-archive.sh
```

O script pede uma passphrase duas vezes e cria `.github/secure/baileys-auth.tar.gz.gpg`. Esse arquivo cifrado pode ser versionado; nunca versione `.auth/baileys`, arquivos `.tar.gz` sem cifragem ou a passphrase.

Configure a mesma passphrase como secret do repositório, sem colocá-la em um comando ou arquivo versionado:

```bash
gh secret set BAILEYS_AUTH_PASSPHRASE
```

Alternativamente, crie esse secret em **Settings > Secrets and variables > Actions > New repository secret**.

Em seguida, adicione e envie o arquivo cifrado e o workflow:

```bash
git add .github/secure/baileys-auth.tar.gz.gpg .github/workflows/update-countdown.yml
git commit -m "configurar atualização diária do grupo"
git push
```

O workflow descriptografa a sessão apenas no runner temporário, com permissões restritas, e nunca imprime seu conteúdo. Após uma execução bem-sucedida, ele recifra eventuais alterações da sessão e atualiza somente o arquivo cifrado no repositório. Se a execução falhar, a sessão versionada não é substituída.

O token do workflow precisa de permissão `contents: write` para persistir a sessão atualizada. A conta do WhatsApp precisa participar do grupo e ter permissão para alterar o nome dele. Se a sessão for invalidada, será necessário autenticar novamente localmente, gerar um novo arquivo cifrado e enviá-lo ao repositório.

Não compartilhe nem versione a pasta de autenticação: ela contém as credenciais do dispositivo conectado.

## Verificação

```bash
npm run typecheck
```

O processo encerra depois que a alteração é concluída. A conta precisa ter permissão para alterar o nome do grupo; caso contrário, o comando exibirá o erro retornado pelo WhatsApp e terminará com código de falha.
