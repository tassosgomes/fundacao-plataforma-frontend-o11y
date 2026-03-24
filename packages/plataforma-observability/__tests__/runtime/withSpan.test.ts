import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpanStatusCode } from '@opentelemetry/api'

const { mockContextWith, mockSetSpan } = vi.hoisted(() => ({
  mockContextWith: vi.fn(),
  mockSetSpan: vi.fn(),
}))

vi.mock('@opentelemetry/api', async () => {
  const actual = await vi.importActual<typeof import('@opentelemetry/api')>(
    '@opentelemetry/api',
  )

  return {
    ...actual,
    context: {
      ...actual.context,
      active: vi.fn(() => 'active-context'),
      with: mockContextWith,
    },
    trace: {
      ...actual.trace,
      setSpan: mockSetSpan,
    },
  }
})

vi.mock('../../src/runtime/createSpan', () => ({
  createSpan: vi.fn(),
}))

import { createSpan } from '../../src/runtime/createSpan'
import { withSpan } from '../../src/runtime/withSpan'

describe('withSpan', () => {
  const mockSpan = {
    end: vi.fn(),
    setStatus: vi.fn(),
    recordException: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createSpan).mockReturnValue(mockSpan as any)
    mockSetSpan.mockReturnValue('span-context')
    mockContextWith.mockImplementation(async (_context, fn) => fn())
  })

  it('executa a função fornecida', async () => {
    const fn = vi.fn().mockResolvedValue('resultado')
    await withSpan('meu-span', {}, fn)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('retorna o resultado da função em caso de sucesso', async () => {
    const fn = vi.fn().mockResolvedValue('valor-retornado')
    const result = await withSpan('meu-span', {}, fn)
    expect(result).toBe('valor-retornado')
  })

  it('chama setStatus com OK em caso de sucesso', async () => {
    await withSpan('meu-span', {}, vi.fn().mockResolvedValue(undefined))
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK })
  })

  it('chama end() ao final em caso de sucesso', async () => {
    await withSpan('meu-span', {}, vi.fn().mockResolvedValue(undefined))
    expect(mockSpan.end).toHaveBeenCalledOnce()
  })

  it('chama createSpan com o nome e atributos fornecidos', async () => {
    const attributes = { feature: 'clientes', operation: 'salvar' }
    await withSpan('ui.action.salvar', attributes, vi.fn().mockResolvedValue(undefined))
    expect(createSpan).toHaveBeenCalledWith('ui.action.salvar', attributes)
  })

  it('executa a funcao dentro do contexto ativo do span', async () => {
    const fn = vi.fn().mockResolvedValue('resultado')

    await withSpan('meu-span', {}, fn)

    expect(mockSetSpan).toHaveBeenCalledWith('active-context', mockSpan)
    expect(mockContextWith).toHaveBeenCalledOnce()
    expect(mockContextWith).toHaveBeenCalledWith('span-context', fn)
  })

  it('re-lança o erro em caso de falha', async () => {
    const error = new Error('falha na operação')
    const fn = vi.fn().mockRejectedValue(error)
    await expect(withSpan('meu-span', {}, fn)).rejects.toThrow('falha na operação')
  })

  it('chama recordException com o erro em caso de falha', async () => {
    const error = new Error('falha')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(withSpan('meu-span', {}, fn)).rejects.toThrow()

    expect(mockSpan.recordException).toHaveBeenCalledWith(error)
  })

  it('chama setStatus com ERROR e a mensagem do erro em caso de falha', async () => {
    const error = new Error('mensagem de erro')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(withSpan('meu-span', {}, fn)).rejects.toThrow()

    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: 'mensagem de erro',
    })
  })

  it('chama end() ao final mesmo em caso de erro', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('falha'))
    await expect(withSpan('meu-span', {}, fn)).rejects.toThrow()
    expect(mockSpan.end).toHaveBeenCalledOnce()
  })

  it('normaliza non-Error para Error ao registrar exceção', async () => {
    const fn = vi.fn().mockRejectedValue('string de erro')
    await expect(withSpan('meu-span', {}, fn)).rejects.toBe('string de erro')
    expect(mockSpan.recordException).toHaveBeenCalledWith(new Error('string de erro'))
  })

  it('inclui a mensagem normalizada no setStatus para non-Error', async () => {
    const fn = vi.fn().mockRejectedValue('string de erro')
    await expect(withSpan('meu-span', {}, fn)).rejects.toBeDefined()
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: 'string de erro',
    })
  })

  it('suporta função síncrona', async () => {
    const fn = vi.fn().mockReturnValue('sync-result')
    const result = await withSpan('meu-span', {}, fn)
    expect(result).toBe('sync-result')
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK })
  })
})
