import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/internal/contextStore', () => ({
  setCurrentMfeContext: vi.fn(),
}))

import { setCurrentMfeContext } from '../../src/internal/contextStore'
import { setMfeContext } from '../../src/runtime/setMfeContext'

describe('setMfeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chama setCurrentMfeContext com o contexto fornecido', () => {
    const context = { mfeName: 'mfe-clientes', mfeVersion: '1.0.0' }
    setMfeContext(context)
    expect(setCurrentMfeContext).toHaveBeenCalledOnce()
    expect(setCurrentMfeContext).toHaveBeenCalledWith(context)
  })

  it('funciona sem mfeVersion', () => {
    const context = { mfeName: 'mfe-simples' }
    setMfeContext(context)
    expect(setCurrentMfeContext).toHaveBeenCalledWith(context)
  })

  it('repassa exatamente o mesmo objeto recebido', () => {
    const context = { mfeName: 'mfe-pagamentos', mfeVersion: '2.5.0' }
    setMfeContext(context)
    expect(setCurrentMfeContext).toHaveBeenCalledWith(context)
  })
})
