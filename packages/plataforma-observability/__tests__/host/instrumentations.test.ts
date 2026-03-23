import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@opentelemetry/instrumentation-document-load', () => ({
  DocumentLoadInstrumentation: vi.fn().mockImplementation(() => ({ name: 'DocumentLoad' })),
}))

vi.mock('@opentelemetry/instrumentation-fetch', () => ({
  FetchInstrumentation: vi.fn().mockImplementation(() => ({ name: 'Fetch' })),
}))

vi.mock('@opentelemetry/instrumentation-xml-http-request', () => ({
  XMLHttpRequestInstrumentation: vi.fn().mockImplementation(() => ({ name: 'XHR' })),
}))

import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import { createInstrumentations } from '../../src/host/instrumentations'

describe('createInstrumentations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria todas as 3 instrumentações por padrão (sem opções)', () => {
    const result = createInstrumentations()
    expect(result).toHaveLength(3)
  })

  it('cria DocumentLoadInstrumentation por padrão', () => {
    createInstrumentations()
    expect(DocumentLoadInstrumentation).toHaveBeenCalledOnce()
  })

  it('cria FetchInstrumentation por padrão', () => {
    createInstrumentations()
    expect(FetchInstrumentation).toHaveBeenCalledOnce()
  })

  it('cria XMLHttpRequestInstrumentation por padrão', () => {
    createInstrumentations()
    expect(XMLHttpRequestInstrumentation).toHaveBeenCalledOnce()
  })

  it('cria todas as 3 instrumentações com opções padrão explícitas', () => {
    const result = createInstrumentations({ documentLoad: true, fetch: true, xhr: true })
    expect(result).toHaveLength(3)
  })

  it('não cria DocumentLoadInstrumentation quando documentLoad=false', () => {
    const result = createInstrumentations({ documentLoad: false })
    expect(DocumentLoadInstrumentation).not.toHaveBeenCalled()
    expect(result).toHaveLength(2)
  })

  it('não cria FetchInstrumentation quando fetch=false', () => {
    const result = createInstrumentations({ fetch: false })
    expect(FetchInstrumentation).not.toHaveBeenCalled()
    expect(result).toHaveLength(2)
  })

  it('não cria XMLHttpRequestInstrumentation quando xhr=false', () => {
    const result = createInstrumentations({ xhr: false })
    expect(XMLHttpRequestInstrumentation).not.toHaveBeenCalled()
    expect(result).toHaveLength(2)
  })

  it('retorna lista vazia quando todas as instrumentações estão desabilitadas', () => {
    const result = createInstrumentations({ documentLoad: false, fetch: false, xhr: false })
    expect(result).toHaveLength(0)
  })

  it('cria apenas DocumentLoad quando fetch e xhr são false', () => {
    const result = createInstrumentations({ fetch: false, xhr: false })
    expect(DocumentLoadInstrumentation).toHaveBeenCalledOnce()
    expect(FetchInstrumentation).not.toHaveBeenCalled()
    expect(XMLHttpRequestInstrumentation).not.toHaveBeenCalled()
    expect(result).toHaveLength(1)
  })

  it('passa clearTimingResources=true para FetchInstrumentation', () => {
    createInstrumentations({ fetch: true })
    expect(FetchInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({ clearTimingResources: true }),
    )
  })

  it('passa clearTimingResources=true para XMLHttpRequestInstrumentation', () => {
    createInstrumentations({ xhr: true })
    expect(XMLHttpRequestInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({ clearTimingResources: true }),
    )
  })

  it('passa propagateTraceHeaderCorsUrls para FetchInstrumentation', () => {
    createInstrumentations({ fetch: true })
    expect(FetchInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({ propagateTraceHeaderCorsUrls: /.*/ }),
    )
  })

  it('passa propagateTraceHeaderCorsUrls para XMLHttpRequestInstrumentation', () => {
    createInstrumentations({ xhr: true })
    expect(XMLHttpRequestInstrumentation).toHaveBeenCalledWith(
      expect.objectContaining({ propagateTraceHeaderCorsUrls: /.*/ }),
    )
  })
})
