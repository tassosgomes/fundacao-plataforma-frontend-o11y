import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpanStatusCode } from '@opentelemetry/api'

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getActiveSpan: vi.fn(),
  },
  SpanStatusCode: {
    OK: 1,
    ERROR: 2,
    UNSET: 0,
  },
}))

vi.mock('../../src/internal/provider', () => ({
  getTracer: vi.fn(),
}))

vi.mock('../../src/internal/contextStore', () => ({
  mergeContextAttributes: vi.fn().mockReturnValue({}),
}))

import { trace } from '@opentelemetry/api'
import { getTracer } from '../../src/internal/provider'
import { mergeContextAttributes } from '../../src/internal/contextStore'
import { recordError } from '../../src/runtime/recordError'

describe('recordError', () => {
  const mockActiveSpan = {
    recordException: vi.fn(),
    setStatus: vi.fn(),
    setAttributes: vi.fn(),
    end: vi.fn(),
  }

  const mockEphemeralSpan = {
    recordException: vi.fn(),
    setStatus: vi.fn(),
    end: vi.fn(),
  }

  const mockTracer = {
    startSpan: vi.fn().mockReturnValue(mockEphemeralSpan),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mergeContextAttributes).mockReturnValue({})
    mockTracer.startSpan.mockReturnValue(mockEphemeralSpan)
  })

  describe('com span ativo', () => {
    beforeEach(() => {
      vi.mocked(trace.getActiveSpan).mockReturnValue(mockActiveSpan as any)
    })

    it('registra o erro no span ativo', () => {
      const error = new Error('erro de teste')
      recordError(error)
      expect(mockActiveSpan.recordException).toHaveBeenCalledWith(error)
    })

    it('define status ERROR no span ativo', () => {
      const error = new Error('erro de teste')
      recordError(error)
      expect(mockActiveSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'erro de teste',
      })
    })

    it('não cria span efêmero quando há span ativo', () => {
      vi.mocked(getTracer).mockReturnValue(mockTracer as any)
      recordError(new Error('erro'))
      expect(getTracer).not.toHaveBeenCalled()
    })

    it('não chama end() no span ativo', () => {
      recordError(new Error('erro'))
      expect(mockActiveSpan.end).not.toHaveBeenCalled()
    })

    it('define atributos de contexto no span ativo quando context é fornecido', () => {
      const mergedAttrs = { feature: 'pagamentos', 'mfe.name': 'mfe-pagamentos' }
      vi.mocked(mergeContextAttributes).mockReturnValue(mergedAttrs)

      const context = { feature: 'pagamentos' }
      recordError(new Error('erro'), context)

      expect(mockActiveSpan.setAttributes).toHaveBeenCalledWith(mergedAttrs)
      expect(mergeContextAttributes).toHaveBeenCalledWith(context)
    })

    it('não chama setAttributes quando context não é fornecido', () => {
      recordError(new Error('erro'))
      expect(mockActiveSpan.setAttributes).not.toHaveBeenCalled()
    })
  })

  describe('sem span ativo', () => {
    beforeEach(() => {
      vi.mocked(trace.getActiveSpan).mockReturnValue(undefined)
      vi.mocked(getTracer).mockReturnValue(mockTracer as any)
    })

    it('cria um span efêmero com nome "error"', () => {
      recordError(new Error('erro'))
      expect(mockTracer.startSpan).toHaveBeenCalledWith('error', expect.any(Object))
    })

    it('registra o erro no span efêmero', () => {
      const error = new Error('erro efêmero')
      recordError(error)
      expect(mockEphemeralSpan.recordException).toHaveBeenCalledWith(error)
    })

    it('define status ERROR no span efêmero', () => {
      const error = new Error('erro efêmero')
      recordError(error)
      expect(mockEphemeralSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'erro efêmero',
      })
    })

    it('chama end() no span efêmero', () => {
      recordError(new Error('erro'))
      expect(mockEphemeralSpan.end).toHaveBeenCalledOnce()
    })

    it('passa atributos mesclados de contexto para o span efêmero', () => {
      const mergedAttrs = { 'mfe.name': 'mfe-x', 'app.route': '/x' }
      vi.mocked(mergeContextAttributes).mockReturnValue(mergedAttrs)

      recordError(new Error('erro'), { feature: 'x' })

      expect(mockTracer.startSpan).toHaveBeenCalledWith('error', { attributes: mergedAttrs })
    })
  })

  describe('normalização de non-Error', () => {
    beforeEach(() => {
      vi.mocked(trace.getActiveSpan).mockReturnValue(mockActiveSpan as any)
    })

    it('normaliza string para Error', () => {
      recordError('mensagem de string')
      expect(mockActiveSpan.recordException).toHaveBeenCalledWith(new Error('mensagem de string'))
    })

    it('normaliza número para Error', () => {
      recordError(42)
      expect(mockActiveSpan.recordException).toHaveBeenCalledWith(new Error('42'))
    })

    it('normaliza objeto para Error via String()', () => {
      recordError({ code: 500 })
      expect(mockActiveSpan.recordException).toHaveBeenCalledWith(
        new Error('[object Object]'),
      )
    })

    it('mantém instâncias de Error como estão', () => {
      const error = new Error('erro real')
      recordError(error)
      expect(mockActiveSpan.recordException).toHaveBeenCalledWith(error)
    })

    it('usa a mensagem do erro normalizado no setStatus', () => {
      recordError('string-error')
      expect(mockActiveSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'string-error',
      })
    })
  })
})
