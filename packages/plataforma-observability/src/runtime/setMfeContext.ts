import { setCurrentMfeContext } from '../internal/contextStore'
import type { MfeContext } from '../types/context'

/**
 * Define o contexto do MFE ativo.
 *
 * Deve ser chamado no componente raiz do MFE ao montar.
 * Atributos são aplicados automaticamente a spans criados após a chamada.
 *
 * @example
 * ```ts
 * // No componente raiz do MFE
 * useEffect(() => {
 *   setMfeContext({ mfeName: 'mfe-clientes', mfeVersion: '1.0.0' })
 * }, [])
 * ```
 */
export function setMfeContext(context: MfeContext): void {
  setCurrentMfeContext(context)
}
