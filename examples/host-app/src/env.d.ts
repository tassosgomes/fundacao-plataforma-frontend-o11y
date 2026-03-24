/// <reference types="vite/client" />

declare module 'mfeClientes/App' {
  import type { ComponentType } from 'react'

  const App: ComponentType
  export default App
}

declare module 'mfePagamentos/App' {
  import type { ComponentType } from 'react'

  const App: ComponentType
  export default App
}

interface ImportMetaEnv {
  readonly VITE_HOST_PLATAFORMA_APP_NAME?: string
  readonly VITE_HOST_PLATAFORMA_APP_ENVIRONMENT?: string
  readonly VITE_HOST_PLATAFORMA_APP_VERSION?: string
  readonly VITE_HOST_PLATAFORMA_OTEL_ENDPOINT?: string
  readonly VITE_MFE_CLIENTES_REMOTE_URL?: string
  readonly VITE_MFE_PAGAMENTOS_REMOTE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}