import { describe, it, expect } from 'vitest'
import { calcularProgressoSubetapa } from './subetapas'

describe('calcularProgressoSubetapa', () => {
  it('retorna 0 quando sem tarefas e sem progresso', () => {
    expect(calcularProgressoSubetapa({ tarefas: [] })).toBe(0)
  })

  it('retorna progresso_percentual quando sem tarefas', () => {
    expect(calcularProgressoSubetapa({ progresso_percentual: 60, tarefas: [] })).toBe(60)
  })

  it('retorna 0 quando sem tarefas e progresso null', () => {
    expect(calcularProgressoSubetapa({ progresso_percentual: null, tarefas: [] })).toBe(0)
  })

  it('retorna 100 quando todas tarefas concluidas', () => {
    const subetapa = { tarefas: [{ status: 'concluida' }, { status: 'concluida' }] }
    expect(calcularProgressoSubetapa(subetapa)).toBe(100)
  })

  it('retorna 0 quando nenhuma tarefa concluida', () => {
    const subetapa = { tarefas: [{ status: 'em_andamento' }] }
    expect(calcularProgressoSubetapa(subetapa)).toBe(0)
  })

  it('retorna percentual arredondado para parcialmente concluidas', () => {
    const subetapa = {
      tarefas: [
        { status: 'concluida' },
        { status: 'em_andamento' },
        { status: 'nao_iniciada' },
      ],
    }
    expect(calcularProgressoSubetapa(subetapa)).toBe(33)
  })
})
