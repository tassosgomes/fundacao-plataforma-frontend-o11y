import { describe, it, expect, beforeEach } from 'vitest'
import {
  setCurrentMfeContext,
  getCurrentMfeContext,
  setCurrentRouteContext,
  getCurrentRouteContext,
  mergeContextAttributes,
  _resetContextStore,
} from '../../src/internal/contextStore'

describe('contextStore', () => {
  beforeEach(() => {
    _resetContextStore()
  })

  describe('setCurrentMfeContext / getCurrentMfeContext', () => {
    it('retorna null antes de definir o contexto', () => {
      expect(getCurrentMfeContext()).toBeNull()
    })

    it('define e retorna o MFE context', () => {
      setCurrentMfeContext({ mfeName: 'mfe-clientes', mfeVersion: '1.0.0' })
      expect(getCurrentMfeContext()).toEqual({ mfeName: 'mfe-clientes', mfeVersion: '1.0.0' })
    })

    it('armazena uma cópia do objeto (não a referência original)', () => {
      const ctx = { mfeName: 'mfe-clientes', mfeVersion: '1.0.0' }
      setCurrentMfeContext(ctx)
      ctx.mfeName = 'mutado'
      expect(getCurrentMfeContext()!.mfeName).toBe('mfe-clientes')
    })

    it('substitui o contexto anterior', () => {
      setCurrentMfeContext({ mfeName: 'mfe-a' })
      setCurrentMfeContext({ mfeName: 'mfe-b', mfeVersion: '2.0.0' })
      expect(getCurrentMfeContext()).toEqual({ mfeName: 'mfe-b', mfeVersion: '2.0.0' })
    })
  })

  describe('setCurrentRouteContext / getCurrentRouteContext', () => {
    it('retorna null antes de definir o contexto', () => {
      expect(getCurrentRouteContext()).toBeNull()
    })

    it('define e retorna o route context', () => {
      setCurrentRouteContext({ appRoute: '/clientes' })
      expect(getCurrentRouteContext()).toEqual({ appRoute: '/clientes' })
    })

    it('armazena uma cópia do objeto (não a referência original)', () => {
      const ctx = { appRoute: '/clientes' }
      setCurrentRouteContext(ctx)
      ctx.appRoute = '/mutado'
      expect(getCurrentRouteContext()!.appRoute).toBe('/clientes')
    })

    it('substitui o contexto anterior', () => {
      setCurrentRouteContext({ appRoute: '/a' })
      setCurrentRouteContext({ appRoute: '/b' })
      expect(getCurrentRouteContext()).toEqual({ appRoute: '/b' })
    })
  })

  describe('mergeContextAttributes', () => {
    it('retorna objeto vazio quando não há contexto e sem atributos explícitos', () => {
      const result = mergeContextAttributes()
      expect(result).toEqual({})
    })

    it('inclui atributos do MFE context quando definido', () => {
      setCurrentMfeContext({ mfeName: 'mfe-pagamentos', mfeVersion: '3.0.0' })
      const result = mergeContextAttributes()
      expect(result).toEqual({
        'mfe.name': 'mfe-pagamentos',
        'mfe.version': '3.0.0',
      })
    })

    it('inclui mfe.name sem mfe.version quando mfeVersion não está definido', () => {
      setCurrentMfeContext({ mfeName: 'mfe-simples' })
      const result = mergeContextAttributes()
      expect(result['mfe.name']).toBe('mfe-simples')
      expect(result['mfe.version']).toBeUndefined()
    })

    it('inclui atributos de route context quando definido', () => {
      setCurrentRouteContext({ appRoute: '/dashboard' })
      const result = mergeContextAttributes()
      expect(result).toEqual({ 'app.route': '/dashboard' })
    })

    it('mescla MFE context e route context juntos', () => {
      setCurrentMfeContext({ mfeName: 'mfe-clientes', mfeVersion: '1.2.3' })
      setCurrentRouteContext({ appRoute: '/clientes/lista' })
      const result = mergeContextAttributes()
      expect(result).toEqual({
        'mfe.name': 'mfe-clientes',
        'mfe.version': '1.2.3',
        'app.route': '/clientes/lista',
      })
    })

    it('atributos explícitos têm precedência sobre o contexto', () => {
      setCurrentMfeContext({ mfeName: 'mfe-clientes', mfeVersion: '1.0.0' })
      setCurrentRouteContext({ appRoute: '/clientes' })
      const result = mergeContextAttributes({
        'mfe.name': 'override-name',
        'app.route': '/override-route',
        feature: 'clientes',
      })
      expect(result['mfe.name']).toBe('override-name')
      expect(result['app.route']).toBe('/override-route')
      expect(result['feature']).toBe('clientes')
    })

    it('ignora atributos explícitos com valor undefined', () => {
      const result = mergeContextAttributes({ feature: undefined, operation: 'salvar' })
      expect(result['feature']).toBeUndefined()
      expect(result['operation']).toBe('salvar')
    })

    it('aceita atributos explícitos de tipos variados (string, number, boolean)', () => {
      const result = mergeContextAttributes({ count: 42, active: true, label: 'test' })
      expect(result['count']).toBe(42)
      expect(result['active']).toBe(true)
      expect(result['label']).toBe('test')
    })
  })

  describe('_resetContextStore', () => {
    it('limpa MFE context e route context', () => {
      setCurrentMfeContext({ mfeName: 'mfe-x' })
      setCurrentRouteContext({ appRoute: '/x' })
      _resetContextStore()
      expect(getCurrentMfeContext()).toBeNull()
      expect(getCurrentRouteContext()).toBeNull()
    })

    it('mergeContextAttributes retorna vazio após reset', () => {
      setCurrentMfeContext({ mfeName: 'mfe-x' })
      setCurrentRouteContext({ appRoute: '/x' })
      _resetContextStore()
      expect(mergeContextAttributes()).toEqual({})
    })

    it('reusa o mesmo store global entre chamadas diferentes', () => {
      setCurrentRouteContext({ appRoute: '/global-route' })

      expect(getCurrentRouteContext()).toEqual({ appRoute: '/global-route' })
      expect(mergeContextAttributes()).toEqual({ 'app.route': '/global-route' })
    })
  })
})
