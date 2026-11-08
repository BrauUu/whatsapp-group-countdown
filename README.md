# Countdown para grupos do WhatsApp

Ferramenta que renomeia um grupo do WhatsApp com uma contagem regressiva até uma data alvo, por exemplo `Meu Grupo (Faltam 10 dias!)`. Ela usa [Baileys](https://github.com/WhiskeySockets/Baileys) para se conectar como um dispositivo vinculado e é executada pelo cron: cada execução calcula o tempo restante, atualiza o nome do grupo e encerra.

## Como funciona

O título muda de formato conforme a data alvo se aproxima:

| Tempo restante              | Título gerado                                  |
| --------------------------- | ---------------------------------------------- |
| Mais de 24 horas            | `Meu Grupo (Faltam 10 dias!)`                  |
| Até 24 horas                | `Meu Grupo (Faltam 12 horas!!)`                |
| Até 1 hora                  | `Meu Grupo (Falta apenas 1 hora!!)`            |
| Até `SHOW_MINUTES_UNTIL`    | `Meu Grupo (Faltam 10 minutos!!)`              |
| 1 minuto                    | `Meu Grupo (Falta apenas 1 minuto!!)`          |
| Data alvo atingida          | `Meu Grupo (Tá liberado, bora jogar!!!)`       |

Dias e horas são arredondados para cima: se faltam 2h10, o título mostra `3 horas`. Todos os cálculos usam o fuso configurado, não o fuso do servidor.

O título só muda quando o comando é executado, então a frequência do cron define a precisão da contagem. Veja [Agendamento com cron](#agendamento-com-cron).

## Requisitos

- Node.js 20 ou superior;
- uma conta do WhatsApp que participe do grupo e tenha permissão para alterar o nome dele;
- um servidor Linux com `cron` e `flock` para a execução automática.

## Instalação

```bash
npm install
```

## Configuração

Toda a configuração fica em [`src/config.ts`](src/config.ts):

```ts
export const COUNTDOWN_TIME_ZONE = 'America/Sao_Paulo' // fuso da data alvo
export const COUNTDOWN_GROUP_JID = '123456789-123456@g.us' // grupo a renomear
export const GROUP_NAME = 'Meu Grupo' // prefixo do título
export const SHOW_MINUTES_UNTIL = 15 // a partir de quantos minutos mostrar minutos

export const TARGET_DATE = {
  year: 2026,
  month: 11,
  day: 19,
  hour: 0,
  minute: 0,
}
```

- **`COUNTDOWN_TIME_ZONE`**: um fuso IANA, como `America/Sao_Paulo` ou `Europe/Lisbon`. A `TARGET_DATE` é interpretada nesse fuso.
- **`COUNTDOWN_GROUP_JID`**: o identificador do grupo, que termina com `@g.us`. Use `npm run list-groups` para descobrir o valor (veja abaixo).
- **`GROUP_NAME`**: o texto que aparece antes dos parênteses.
- **`SHOW_MINUTES_UNTIL`**: quando faltarem esse número de minutos ou menos, o título passa a mostrar minutos.
- **`TARGET_DATE`**: a data e hora em que a contagem termina. O mês vai de 1 a 12.

## Primeiro acesso

Na primeira execução, um QR Code aparece no terminal. No celular, abra **WhatsApp > Configurações > Dispositivos conectados > Conectar dispositivo** e escaneie o código. A sessão fica salva em `.auth/baileys` e é reutilizada nas próximas execuções, inclusive pelo cron.

Faça isso manualmente no servidor antes de configurar o cron:

```bash
npm run list-groups
```

A saída lista os grupos da conta no formato `Nome do grupo -> JID`. Copie o JID do grupo para `COUNTDOWN_GROUP_JID`.

> Não compartilhe nem versione a pasta `.auth/baileys`: ela contém as credenciais do dispositivo conectado.

Para guardar a sessão em outro diretório, defina `BAILEYS_AUTH_DIR` em todos os comandos, inclusive no cron:

```bash
BAILEYS_AUTH_DIR="/caminho/para/sessao" npm run list-groups
```

Se a sessão for desconectada pelo celular ou ficar inválida, as credenciais são apagadas e um novo QR Code é exibido. Quando isso acontece numa execução do cron, o QR vai para o log; rode o comando manualmente para escanear.

## Comandos

| Comando                                               | O que faz                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `npm run update-countdown`                            | Calcula o título e atualiza o grupo configurado.             |
| `npm run list-groups`                                 | Lista os grupos da conta com seus JIDs.                      |
| `npm run rename-group -- "<jid>" "<nome>"`            | Renomeia qualquer grupo com um nome fixo.                    |
| `npm test`                                            | Roda os testes do cálculo do título.                         |
| `npm run typecheck`                                   | Verifica os tipos do projeto.                                |

Se o grupo já tiver o nome calculado, `update-countdown` não faz nenhuma alteração. Por isso, executar o comando mais vezes do que o necessário não causa problema.

## Agendamento com cron

Use o script [`scripts/update-countdown-cron.sh`](scripts/update-countdown-cron.sh) no cron, em vez de chamar o `npm` diretamente. Ele roda o comando a partir da pasta do projeto e usa `flock` para impedir duas execuções simultâneas; se uma execução ainda estiver em andamento, a seguinte encerra sem fazer nada.

```bash
chmod +x scripts/update-countdown-cron.sh
crontab -e
```

Como o título tem três fases (dias, horas e minutos), são necessárias três linhas no crontab, cada uma com a frequência adequada à sua fase:

1. **Diariamente**, no mesmo horário da data alvo: atualiza a contagem de dias.
2. **De hora em hora** nas 24 horas anteriores à data alvo: atualiza a contagem de horas.
3. **A cada minuto** nos últimos `SHOW_MINUTES_UNTIL` minutos: atualiza a contagem de minutos.

Com só a primeira linha, a contagem fica parada em `Faltam 24 horas!!` durante o último dia.

### Exemplo

Para `TARGET_DATE` em 19/11 às 00:00, `SHOW_MINUTES_UNTIL = 15` e fuso `America/Sao_Paulo`:

```cron
CRON_TZ=America/Sao_Paulo
PROJECT=/caminho/para/wpp-bot-gta-vi-date
LOG=/tmp/wpp-bot-gta-vi-date.log

# 1. dias: todo dia à meia-noite
0 0 * * *         $PROJECT/scripts/update-countdown-cron.sh >> $LOG 2>&1
# 2. horas: de hora em hora no dia 18/11
0 1-23 18 11 *    $PROJECT/scripts/update-countdown-cron.sh >> $LOG 2>&1
# 3. minutos: a cada minuto das 23:45 às 23:59 de 18/11
45-59 23 18 11 *  $PROJECT/scripts/update-countdown-cron.sh >> $LOG 2>&1
```

A execução diária da meia-noite de 19/11 já coloca o título final (`Tá liberado`).

### Adaptando para outra data

Se a data alvo for `DD/MM` às `HH:MM`, monte as linhas assim:

| Linha   | Quando rodar                                                  | Campos do cron                         |
| ------- | ------------------------------------------------------------- | -------------------------------------- |
| Dias    | todo dia às `HH:MM`                                           | `MM HH * * *`                          |
| Horas   | de hora em hora, entre `HH:MM` da véspera e `HH:MM` do dia    | minuto `MM`, horas e dias da véspera e do dia |
| Minutos | a cada minuto nos `SHOW_MINUTES_UNTIL` minutos antes do alvo  | intervalo de minutos antes de `HH:MM`  |

Exemplo para a data alvo 05/03 às 18:30 com `SHOW_MINUTES_UNTIL = 10`:

```cron
CRON_TZ=Europe/Lisbon

# dias: todo dia às 18:30
30 18 * * *      $PROJECT/scripts/update-countdown-cron.sh >> $LOG 2>&1
# horas: das 19:30 de 04/03 até as 23:30
30 19-23 4 3 *   $PROJECT/scripts/update-countdown-cron.sh >> $LOG 2>&1
# horas: da 00:30 até as 17:30 de 05/03
30 0-17 5 3 *    $PROJECT/scripts/update-countdown-cron.sh >> $LOG 2>&1
# minutos: das 18:20 às 18:29 de 05/03
20-29 18 5 3 *   $PROJECT/scripts/update-countdown-cron.sh >> $LOG 2>&1
```

Quando a véspera e o dia alvo caem em meses diferentes (por exemplo, alvo em 01/12), cada parte precisa de uma linha própria com o mês correto.

### Observações sobre o cron

- **Fuso horário:** `CRON_TZ` é suportado pelo cronie (Fedora, RHEL, Arch). O cron do Debian/Ubuntu ignora essa variável e usa o fuso do sistema. Nesse caso, converta os horários das linhas para o fuso do servidor ou ajuste o fuso do sistema (`timedatectl set-timezone America/Sao_Paulo`). O cálculo do título sempre usa `COUNTDOWN_TIME_ZONE`, independentemente do cron.
- **Duração de cada execução:** cada execução abre uma conexão nova com o WhatsApp, o que leva alguns segundos. Se uma execução passar de um minuto, a seguinte é pulada pelo `flock` e aquele minuto fica sem atualização.
- **Limite do WhatsApp:** renomear o grupo muitas vezes seguidas pode esbarrar em limites de frequência. Se isso acontecer, rode a terceira linha a cada poucos minutos (por exemplo, `45-59/5`) ou reduza `SHOW_MINUTES_UNTIL`.
- **Logs:** acompanhe as execuções com `tail -f /tmp/wpp-bot-gta-vi-date.log`. Cada execução registra o nome atual e o novo nome do grupo.

Para testar a configuração antes da data, rode o script manualmente:

```bash
./scripts/update-countdown-cron.sh
```

## Estrutura do projeto

```
src/
  config.ts           # grupo, nome, fuso e data alvo
  countdown.ts        # cálculo do título a partir da data atual
  rename-group.ts     # CLI e conexão com o WhatsApp
scripts/
  update-countdown-cron.sh  # wrapper com lock para o cron
test/
  countdown.test.ts   # testes de todas as variações do título
```

## Solução de problemas

- **`JID de grupo inválido`**: o JID deve terminar com `@g.us`. Confira com `npm run list-groups`.
- **Erro de permissão ao renomear**: a conta conectada precisa poder editar os dados do grupo. Nas configurações do grupo, permita que todos editem ou torne a conta administradora.
- **`Não foi possível conectar ao WhatsApp após 5 tentativas`**: verifique a conexão com a internet do servidor e se o dispositivo continua listado em **Dispositivos conectados** no celular.
- **O QR Code aparece no log do cron**: a sessão expirou. Rode `npm run update-countdown` manualmente no servidor e escaneie o código de novo.
