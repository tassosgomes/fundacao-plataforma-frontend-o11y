import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@opentelemetry/sdk-trace-web', () => ({
  WebTracerProvider: vi.fn().mockImplementation(() => ({
    addSpanProcessor: vi.fn(),
    register: vi.fn(),
    forceFlush: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
  BatchSpanProcessor: vi.fn(),
}))

vi.mock('@opentelemetry/instrumentation', () => ({
  registerInstrumentations: vi.fn(),
}))

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn().mockReturnValue({ startSpan: vi.fn() }),
  },
}))

import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { trace } from '@opentelemetry/api'
import {
  initProvider,
  getTracer,
  isInitialized,
  _shutdownProvider,
} from '../../src/internal/provider'
import type { ProviderInitOptions } from '../../src/internal/provider'

function makeOptions(): ProviderInitOptions {
  return {
    resource: {} as any,
    exporter: {} as any,
    instrumentations: [],
  }
}

describe('provider', () => {
  beforeEach(async () => {
    await _shutdownProvider()
    vi.clearAllMocks()
    // Re-apply the mock return value after clearAllMocks
    vi.mocked(WebTracerProvider).mockImplementation(() => ({
      addSpanProcessor: vi.fn(),
      register: vi.fn(),
      forceFlush: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
    }))
    vi.mocked(trace.getTracer).mockReturnValue({ startSpan: vi.fn() } as any)
  })

  describe('initProvider', () => {
    it('inicializa o provider corretamente na primeira chamada', () => {
      initProvider(makeOptions())
      expect(WebTracerProvider).toHaveBeenCalledOnce()
      expect(BatchSpanProcessor).toHaveBeenCalledOnce()
      expect(registerInstrumentations).toHaveBeenCalledOnce()
    })

    it('chama addSpanProcessor e register no provider criado', () => {
      initProvider(makeOptions())
      const instance = vi.mocked(WebTracerProvider).mock.results[0].value
      expect(instance.addSpanProcessor).toHaveBeenCalledOnce()
      expect(instance.register).toHaveBeenCalledOnce()
    })

    it('passa o resource para o WebTracerProvider', () => {
      const resource = { attributes: { 'service.name': 'test-service' } } as any
      initProvider({ ...makeOptions(), resource })
      expect(WebTracerProvider).toHaveBeenCalledWith({ resource })
    })

    it('passa o exporter para o BatchSpanProcessor', () => {
      const exporter = { url: 'http://otel:4318/v1/traces' } as any
      initProvider({ ...makeOptions(), exporter })
      expect(BatchSpanProcessor).toHaveBeenCalledWith(exporter)
    })

    it('passa as instrumentações para registerInstrumentations', () => {
      const instrumentations = [{ name: 'fake-instr' }] as any[]
      initProvider({ ...makeOptions(), instrumentations })
      expect(registerInstrumentations).toHaveBeenCalledWith({ instrumentations })
    })
  })

  describe('initProvider chamado duas vezes', () => {
    it('segunda chamada é ignorada (não inicializa novamente)', () => {
      initProvider(makeOptions())
      initProvider(makeOptions())
      expect(WebTracerProvider).toHaveBeenCalledOnce()
    })

    it('segunda chamada emite console.warn em não-produção', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      initProvider(makeOptions())
      initProvider(makeOptions())

      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy.mock.calls[0][0]).toContain('initObservability()')

      process.env.NODE_ENV = originalEnv
      warnSpy.mockRestore()
    })

    it('segunda chamada NÃO emite console.warn em produção', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      initProvider(makeOptions())
      initProvider(makeOptions())

      expect(warnSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
      warnSpy.mockRestore()
    })
  })

  describe('getTracer', () => {
    it('retorna o tracer via trace.getTracer', () => {
      const mockTracer = { startSpan: vi.fn() }
      vi.mocked(trace.getTracer).mockReturnValue(mockTracer as any)

      const tracer = getTracer()
      expect(trace.getTracer).toHaveBeenCalledWith('@ECADBR/plataforma-observability')
      expect(tracer).toBe(mockTracer)
    })
  })

  describe('isInitialized', () => {
    it('retorna false antes de initProvider', () => {
      expect(isInitialized()).toBe(false)
    })

    it('retorna true depois de initProvider', () => {
      initProvider(makeOptions())
      expect(isInitialized()).toBe(true)
    })
  })

  describe('_shutdownProvider', () => {
    it('chama forceFlush e shutdown no provider', async () => {
      initProvider(makeOptions())
      const instance = vi.mocked(WebTracerProvider).mock.results[0].value

      await _shutdownProvider()

      expect(instance.forceFlush).toHaveBeenCalledOnce()
      expect(instance.shutdown).toHaveBeenCalledOnce()
    })

    it('reseta isInitialized para false após shutdown', async () => {
      initProvider(makeOptions())
      expect(isInitialized()).toBe(true)

      await _shutdownProvider()
      expect(isInitialized()).toBe(false)
    })

    it('não lança erro se chamado sem provider inicializado', async () => {
      await expect(_shutdownProvider()).resolves.toBeUndefined()
    })
  })
})
