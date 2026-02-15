import { describe, it, expect } from 'vitest'
import { calculateStageProgress, calculateStageDates } from './etapas'

describe('calculateStageProgress', () => {
  it('retorna 0 quando sem subetapas e sem progresso', () => {
    expect(calculateStageProgress({ subetapas: [] })).toBe(0)
  })

  it('retorna progresso_percentual quando sem subetapas', () => {
    expect(calculateStageProgress({ progresso_percentual: 75, subetapas: [] })).toBe(75)
  })

  it('retorna 0 quando sem subetapas e progresso null', () => {
    expect(calculateStageProgress({ progresso_percentual: null, subetapas: [] })).toBe(0)
  })

  it('retorna 100 quando todas subetapas concluidas', () => {
    const etapa = { subetapas: [{ status: 'concluida' }, { status: 'concluida' }] }
    expect(calculateStageProgress(etapa)).toBe(100)
  })

  it('retorna 0 quando nenhuma subetapa concluida', () => {
    const etapa = { subetapas: [{ status: 'em_andamento' }, { status: 'nao_iniciada' }] }
    expect(calculateStageProgress(etapa)).toBe(0)
  })

  it('retorna percentual arredondado para parcialmente concluidas', () => {
    const etapa = {
      subetapas: [
        { status: 'concluida' },
        { status: 'em_andamento' },
        { status: 'nao_iniciada' },
      ],
    }
    expect(calculateStageProgress(etapa)).toBe(33)
  })

  it('retorna 50 quando uma de duas concluidas', () => {
    const etapa = { subetapas: [{ status: 'concluida' }, { status: 'em_andamento' }] }
    expect(calculateStageProgress(etapa)).toBe(50)
  })
})

describe('calculateStageDates', () => {
  it('retorna null para array vazio', () => {
    expect(calculateStageDates([])).toEqual({ inicio: null, fim: null })
  })

  it('retorna null quando todas datas sao null', () => {
    const subetapas = [{ data_inicio_prevista: null, data_fim_prevista: null }]
    expect(calculateStageDates(subetapas)).toEqual({ inicio: null, fim: null })
  })

  it('retorna menor inicio e maior fim', () => {
    const subetapas = [
      { data_inicio_prevista: '2026-03-01', data_fim_prevista: '2026-03-15' },
      { data_inicio_prevista: '2026-02-15', data_fim_prevista: '2026-04-01' },
    ]
    expect(calculateStageDates(subetapas)).toEqual({ inicio: '2026-02-15', fim: '2026-04-01' })
  })

  it('retorna apenas inicio quando fim e null', () => {
    const subetapas = [{ data_inicio_prevista: '2026-01-10', data_fim_prevista: null }]
    expect(calculateStageDates(subetapas)).toEqual({ inicio: '2026-01-10', fim: null })
  })

  it('retorna apenas fim quando inicio e null', () => {
    const subetapas = [{ data_inicio_prevista: null, data_fim_prevista: '2026-06-30' }]
    expect(calculateStageDates(subetapas)).toEqual({ inicio: null, fim: '2026-06-30' })
  })

  it('combina datas de subetapas com valores misturados', () => {
    const subetapas = [
      { data_inicio_prevista: '2026-05-01', data_fim_prevista: null },
      { data_inicio_prevista: null, data_fim_prevista: '2026-07-01' },
    ]
    expect(calculateStageDates(subetapas)).toEqual({ inicio: '2026-05-01', fim: '2026-07-01' })
  })

  it('retorna mesma data quando todas subetapas tem datas iguais', () => {
    const subetapas = [
      { data_inicio_prevista: '2026-01-01', data_fim_prevista: '2026-01-01' },
      { data_inicio_prevista: '2026-01-01', data_fim_prevista: '2026-01-01' },
    ]
    expect(calculateStageDates(subetapas)).toEqual({ inicio: '2026-01-01', fim: '2026-01-01' })
  })
})
