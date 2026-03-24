import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setRouteContext } from '@ECADBR/plataforma-observability'

export function RouteTracker(): null {
  const location = useLocation()

  useEffect(() => {
    setRouteContext({ appRoute: location.pathname })
  }, [location.pathname])

  return null
}