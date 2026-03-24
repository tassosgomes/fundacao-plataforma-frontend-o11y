import federation from '@originjs/vite-plugin-federation'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const otelApiEntryPath = resolve(__dirname, '../node_modules/@opentelemetry/api/build/esm/index.js')
const otelApiVersion = '1.9.0'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'mfe-pagamentos',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App',
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
  build: {
    cssCodeSplit: false,
  },
  server: {
    port: 4172,
    strictPort: true,
    cors: true,
  },
  preview: {
    port: 4272,
    strictPort: true,
  },
})