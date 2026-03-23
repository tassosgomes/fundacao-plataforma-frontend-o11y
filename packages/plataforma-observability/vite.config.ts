import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PlataformaObservability',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // Não incluir @opentelemetry/api no bundle — é peerDependency / shared
      external: ['@opentelemetry/api'],
      output: {
        globals: {
          '@opentelemetry/api': 'opentelemetry.api',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
  },
})
