import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/internal/contextStore', () => ({
  setCurrentRouteContext: vi.fn(),
}))

import { setCurrentRouteContext } from '../../src/internal/contextStore'
import { setRouteContext } from '../../src/runtime/setRouteContext'

describe('setRouteContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chama setCurrentRouteContext com o contexto fornecido', () => {
    const context = { appRoute: '/clientes' }
    setRouteContext(context)
    expect(setCurrentRouteContext).toHaveBeenCalledOnce()
    expect(setCurrentRouteContext).toHaveBeenCalledWith(context)
  })

  it('funciona com rotas aninhadas', () => {
    const context = { appRoute: '/clientes/123/detalhes' }
    setRouteContext(context)
    expect(setCurrentRouteContext).toHaveBeenCalledWith(context)
  })

  it('repassa exatamente o mesmo objeto recebido', () => {
    const context = { appRoute: '/dashboard' }
    setRouteContext(context)
    expect(setCurrentRouteContext).toHaveBeenCalledWith(context)
  })
})
