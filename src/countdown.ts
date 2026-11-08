import { COUNTDOWN_TIME_ZONE, GROUP_NAME, TARGET_DATE, SHOW_MINUTES_UNTIL } from './config.js'

const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR

type CalendarDate = typeof TARGET_DATE

const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: COUNTDOWN_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function getCalendarDate(date: Date): CalendarDate {
  const parts = Object.fromEntries(
    datePartsFormatter.formatToParts(date).map(part => [part.type, Number(part.value)]),
  )

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  }
}

function toMinuteNumber(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day, date.hour, date.minute) / 60_000
}

function formatRemaining(
  amount: number,
  singular: string,
  plural: string,
  emphasis: string,
): string {
  const text = amount === 1 ? `Falta apenas 1 ${singular}` : `Faltam ${amount} ${plural}`
  return `${GROUP_NAME} (${text}${emphasis})`
}

export function getCountdownSubject(now: Date = new Date()): string {
  const minutesRemaining = toMinuteNumber(TARGET_DATE) - toMinuteNumber(getCalendarDate(now))

  if (minutesRemaining <= 0) {
    return `${GROUP_NAME} (Tá liberado, bora jogar!!!)`
  }

  if (minutesRemaining <= SHOW_MINUTES_UNTIL) {
    return formatRemaining(minutesRemaining, 'minuto', 'minutos', '!!')
  }

  if (minutesRemaining <= MINUTES_PER_DAY) {
    const hoursRemaining = Math.ceil(minutesRemaining / MINUTES_PER_HOUR)
    return formatRemaining(hoursRemaining, 'hora', 'horas', '!!')
  }

  const daysRemaining = Math.ceil(minutesRemaining / MINUTES_PER_DAY)
  return formatRemaining(daysRemaining, 'dia', 'dias', '!')
}
