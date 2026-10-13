import assert from 'node:assert/strict'
import test from 'node:test'
import { getCountdownSubject } from '../src/countdown.js'

test('calcula os dias restantes no fuso de São Paulo', () => {
  assert.equal(
    getCountdownSubject(new Date('2026-11-18T12:00:00-03:00')),
    'Anti-Bahia (Faltam 1 dias)',
  )
})

test('usa a mensagem especial na data alvo', () => {
  assert.equal(
    getCountdownSubject(new Date('2026-11-19T00:00:00-03:00')),
    'Anti-Bahia (É hoje!!!)',
  )
})

test('mantém a mensagem especial depois da data alvo', () => {
  assert.equal(
    getCountdownSubject(new Date('2026-11-20T12:00:00-03:00')),
    'Anti-Bahia (É hoje!!!)',
  )
})

test('considera a data local de São Paulo perto da meia-noite', () => {
  assert.equal(
    getCountdownSubject(new Date('2026-11-18T23:59:59-03:00')),
    'Anti-Bahia (Faltam 1 dias)',
  )
  assert.equal(
    getCountdownSubject(new Date('2026-11-19T00:00:00-03:00')),
    'Anti-Bahia (É hoje!!!)',
  )
})
