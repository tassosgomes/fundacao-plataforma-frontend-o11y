import { setCurrentRouteContext } from '../internal/contextStore'
import type { RouteContext } from '../types/context'

/**
 * Define a rota atual da aplicação.
 *
 * Deve ser chamado pelo Host quando a rota muda (integração com router).
 * Atributos são aplicados automaticamente a spans criados após a chamada.
 *
 * @example
 * ```ts
 * // No Host, integrado com React Router
 * const location = useLocation()
 * useEffect(() => {
 *   setRouteContext({ appRoute: location.pathname })
 * }, [location.pathname])
 * ```
 */
export function setRouteContext(context: RouteContext): void {
  setCurrentRouteContext(context)
}
