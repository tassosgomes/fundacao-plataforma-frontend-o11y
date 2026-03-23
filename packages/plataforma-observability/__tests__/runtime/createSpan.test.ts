import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/internal/provider', () => ({
  getTracer: vi.fn(),
}))

vi.mock('../../src/internal/contextStore', () => ({
  mergeContextAttributes: vi.fn(),
}))

import { getTracer } from '../../src/internal/provider'
import { mergeContextAttributes } from '../../src/internal/contextStore'
import { createSpan } from '../../src/runtime/createSpan'

describe('createSpan', () => {
  const mockSpan = { end: vi.fn(), setStatus: vi.fn(), recordException: vi.fn() }
  const mockTracer = { startSpan: vi.fn().mockReturnValue(mockSpan) }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTracer).mockReturnValue(mockTracer as any)
    vi.mocked(mergeContextAttributes).mockReturnValue({})
    mockTracer.startSpan.mockReturnValue(mockSpan)
  })

  it('cria um span com o nome fornecido', () => {
    createSpan('feature.clientes.salvar')
    expect(mockTracer.startSpan).toHaveBeenCalledWith(
      'feature.clientes.salvar',
      expect.any(Object),
    )
  })

  it('retorna o span criado pelo tracer', () => {
    const result = createSpan('meu-span')
    expect(result).toBe(mockSpan)
  })

  it('chama mergeContextAttributes com os atributos fornecidos', () => {
    const attributes = { feature: 'clientes', operation: 'salvar' }
    createSpan('meu-span', attributes)
    expect(mergeContextAttributes).toHaveBeenCalledWith(attributes)
  })

  it('chama mergeContextAttributes com undefined quando não há atributos', () => {
    createSpan('meu-span')
    expect(mergeContextAttributes).toHaveBeenCalledWith(undefined)
  })

  it('passa os atributos mesclados do contexto para o span', () => {
    const mergedAttributes = { 'mfe.name': 'mfe-clientes', feature: 'clientes' }
    vi.mocked(mergeContextAttributes).mockReturnValue(mergedAttributes)

    createSpan('meu-span', { feature: 'clientes' })

    expect(mockTracer.startSpan).toHaveBeenCalledWith('meu-span', {
      attributes: mergedAttributes,
    })
  })

  it('injeta atributos de contexto via mergeContextAttributes mesmo sem atributos explícitos', () => {
    const contextAttributes = { 'mfe.name': 'mfe-pagamentos', 'app.route': '/pagamentos' }
    vi.mocked(mergeContextAttributes).mockReturnValue(contextAttributes)

    createSpan('span-sem-atributos-explicitos')

    expect(mockTracer.startSpan).toHaveBeenCalledWith('span-sem-atributos-explicitos', {
      attributes: contextAttributes,
    })
  })
})
