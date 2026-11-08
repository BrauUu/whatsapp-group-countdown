import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { GROUP_NAME } from '../src/config.js'
import { getCountdownSubject } from '../src/countdown.js'

function subjectAt(isoDate: string): string {
  return getCountdownSubject(new Date(isoDate))
}

describe('getCountdownSubject', () => {
  describe('dias', () => {
    test('mostra os dias restantes', () => {
      assert.equal(subjectAt('2026-11-09T12:00:00-03:00'), `${GROUP_NAME} (Faltam 10 dias!)`)
    })

    test('arredonda para cima dias incompletos', () => {
      assert.equal(subjectAt('2026-11-17T00:01:00-03:00'), `${GROUP_NAME} (Faltam 2 dias!)`)
      assert.equal(subjectAt('2026-11-16T23:59:00-03:00'), `${GROUP_NAME} (Faltam 3 dias!)`)
    })

    test('usa o fuso de São Paulo, não UTC', () => {
      assert.equal(subjectAt('2026-11-18T02:59:00Z'), `${GROUP_NAME} (Faltam 2 dias!)`)
    })
  })

  describe('horas', () => {
    test('mostra 24 horas exatamente um dia antes', () => {
      assert.equal(subjectAt('2026-11-18T00:00:00-03:00'), `${GROUP_NAME} (Faltam 24 horas!!)`)
    })

    test('mostra as horas restantes no último dia', () => {
      assert.equal(subjectAt('2026-11-18T12:00:00-03:00'), `${GROUP_NAME} (Faltam 12 horas!!)`)
    })

    test('arredonda para cima horas incompletas', () => {
      assert.equal(subjectAt('2026-11-18T21:50:00-03:00'), `${GROUP_NAME} (Faltam 3 horas!!)`)
    })

    test('usa o singular quando falta 1 hora', () => {
      assert.equal(subjectAt('2026-11-18T23:00:00-03:00'), `${GROUP_NAME} (Falta apenas 1 hora!!)`)
      assert.equal(subjectAt('2026-11-18T23:44:00-03:00'), `${GROUP_NAME} (Falta apenas 1 hora!!)`)
    })
  })

  describe('minutos', () => {
    test('mostra minutos a partir de 15 minutos restantes', () => {
      assert.equal(subjectAt('2026-11-18T23:45:00-03:00'), `${GROUP_NAME} (Faltam 15 minutos!!)`)
      assert.equal(subjectAt('2026-11-18T23:50:00-03:00'), `${GROUP_NAME} (Faltam 10 minutos!!)`)
    })

    test('usa o singular quando falta 1 minuto', () => {
      assert.equal(subjectAt('2026-11-18T23:59:00-03:00'), `${GROUP_NAME} (Falta apenas 1 minuto!!)`)
    })

    test('ignora os segundos', () => {
      assert.equal(subjectAt('2026-11-18T23:59:59-03:00'), `${GROUP_NAME} (Falta apenas 1 minuto!!)`)
    })
  })

  describe('liberado', () => {
    test('libera exatamente na data alvo', () => {
      assert.equal(subjectAt('2026-11-19T00:00:00-03:00'), `${GROUP_NAME} (Tá liberado, bora jogar!!!)`)
    })

    test('continua liberado depois da data alvo', () => {
      assert.equal(subjectAt('2026-11-25T15:00:00-03:00'), `${GROUP_NAME} (Tá liberado, bora jogar!!!)`)
    })
  })
})
