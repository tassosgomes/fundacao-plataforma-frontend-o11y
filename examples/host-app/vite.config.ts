import federation from '@originjs/vite-plugin-federation'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'

const otelApiEntryPath = resolve(__dirname, '../node_modules/@opentelemetry/api/build/esm/index.js')
const otelApiVersion = '1.9.0'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const remoteEntryPath =
    command === 'serve' ? 'remoteEntry.js' : 'assets/remoteEntry.js'
  const resolveRemoteEntryUrl = (override: string | undefined, fallbackBaseUrl: string) => {
    if (override) {
      return override.endsWith('.js') ? override : `${override}/${remoteEntryPath}`
    }

    return `${fallbackBaseUrl}/${remoteEntryPath}`
  }
  const defaultRemoteBaseUrls =
    command === 'serve'
      ? {
          clientes: 'http://localhost:4171',
          pagamentos: 'http://localhost:4172',
        }
      : {
          clientes: 'http://localhost:4271',
          pagamentos: 'http://localhost:4272',
        }

  const mfeClientesRemoteEntryUrl = resolveRemoteEntryUrl(
    env.VITE_MFE_CLIENTES_REMOTE_URL,
    defaultRemoteBaseUrls.clientes,
  )
  const mfePagamentosRemoteEntryUrl = resolveRemoteEntryUrl(
    env.VITE_MFE_PAGAMENTOS_REMOTE_URL,
    defaultRemoteBaseUrls.pagamentos,
  )

  return {
    plugins: [
      react(),
      federation({
        name: 'host-app',
        remotes: {
          mfeClientes: mfeClientesRemoteEntryUrl,
          mfePagamentos: mfePagamentosRemoteEntryUrl,
        },
        shared: {
          react: {},
          'react-dom': {},
          '@opentelemetry/api': {
            packagePath: otelApiEntryPath,
            version: otelApiVersion,
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@ECADBR/plataforma-observability': resolve(
          __dirname,
          '../../packages/plataforma-observability/src/index.ts',
        ),
      },
    },
    server: {
      port: 4170,
      strictPort: true,
    },
    preview: {
      port: 4270,
      strictPort: true,
    },
  }
})