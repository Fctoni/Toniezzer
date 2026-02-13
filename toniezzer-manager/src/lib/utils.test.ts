import { describe, it, expect } from 'vitest'
import { formatDateToString, parseDateString } from './utils'

describe('formatDateToString', () => {
  it('formata data normal para YYYY-MM-DD', () => {
    expect(formatDateToString(new Date(2026, 0, 15))).toBe('2026-01-15')
  })

  it('formata primeiro dia do ano', () => {
    expect(formatDateToString(new Date(2026, 0, 1))).toBe('2026-01-01')
  })

  it('formata ultimo dia do ano', () => {
    expect(formatDateToString(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('adiciona zero a esquerda em dia e mes', () => {
    expect(formatDateToString(new Date(2026, 2, 5))).toBe('2026-03-05')
  })
})

describe('parseDateString', () => {
  it('converte string YYYY-MM-DD para Date', () => {
    const date = parseDateString('2026-01-15')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(15)
  })

  it('converte primeiro dia do ano', () => {
    const date = parseDateString('2026-01-01')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(1)
  })

  it('round-trip format -> parse preserva a data', () => {
    const original = new Date(2026, 5, 20)
    const formatted = formatDateToString(original)
    const parsed = parseDateString(formatted)
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(5)
    expect(parsed.getDate()).toBe(20)
  })
})
