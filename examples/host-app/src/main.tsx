import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { initObservability } from '@ECADBR/plataforma-observability'
import App from './App'
import './styles.css'

initObservability({
  serviceName: import.meta.env.VITE_HOST_PLATAFORMA_APP_NAME ?? 'demo-host-observability',
  environment: import.meta.env.VITE_HOST_PLATAFORMA_APP_ENVIRONMENT ?? 'local',
  endpoint:
    import.meta.env.VITE_HOST_PLATAFORMA_OTEL_ENDPOINT ??
    'http://localhost:4318/v1/traces',
  serviceVersion: import.meta.env.VITE_HOST_PLATAFORMA_APP_VERSION ?? '0.1.0-demo',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)