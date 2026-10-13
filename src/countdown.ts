export const COUNTDOWN_TIME_ZONE = 'America/Sao_Paulo'
export const COUNTDOWN_GROUP_JID = '120363414129535932@g.us'

const TARGET_DATE = {
  year: 2026,
  month: 11,
  day: 19,
} as const

type CalendarDate = {
  year: number
  month: number
  day: number
}

const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: COUNTDOWN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  const value = parts.find(part => part.type === type)?.value

  if (!value) {
    throw new Error(`Não foi possível obter a parte de data: ${type}`)
  }

  return Number(value)
}

function getCalendarDate(date: Date): CalendarDate {
  const parts = datePartsFormatter.formatToParts(date)

  return {
    year: getPart(parts, 'year'),
    month: getPart(parts, 'month'),
    day: getPart(parts, 'day'),
  }
}

function toDayNumber(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day) / 86_400_000
}

export function getCountdownSubject(now: Date = new Date()): string {
  const daysRemaining =
    toDayNumber(TARGET_DATE) - toDayNumber(getCalendarDate(now))

  if (daysRemaining <= 0) {
    return 'Anti-Bahia (É hoje!!!)'
  }

  return `Anti-Bahia (Faltam ${daysRemaining} dias)`
}
