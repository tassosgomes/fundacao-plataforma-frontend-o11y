import { context, propagation, SpanStatusCode, trace } from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { Resource } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import cors from 'cors'
import express, { type Request, type Response } from 'express'
import { readFileSync } from 'node:fs'

type CustomerPayload = {
  segment: string
  customers: Array<{
    id: string
    nome: string
    status: string
  }>
}

const customerFixture = JSON.parse(
  readFileSync(
    new URL('../../mfe-clientes/public/api/clientes-demo.json', import.meta.url),
    'utf8',
  ),
) as CustomerPayload

const serviceName = process.env.OTEL_SERVICE_NAME ?? 'demo-backend-clientes'
const serviceVersion = process.env.OTEL_SERVICE_VERSION ?? '0.1.0-demo'
const environment = process.env.OTEL_SERVICE_ENVIRONMENT ?? 'local'
const collectorBaseUrl = process.env.OTEL_EXPORTER_OTLP_BASE_URL ?? 'http://localhost:4318'
const port = Number(process.env.PORT ?? '4319')
const tracer = trace.getTracer(serviceName, serviceVersion)

const provider = new NodeTracerProvider({
  resource: new Resource({
    'service.name': serviceName,
    'service.version': serviceVersion,
    'deployment.environment': environment,
  }),
})

provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: `${collectorBaseUrl}/v1/traces`,
    }),
  ),
)

provider.register({
  contextManager: new AsyncLocalStorageContextManager(),
})

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
})

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} nao permitida na demo.`))
    },
    allowedHeaders: ['Content-Type', 'traceparent', 'tracestate'],
    exposedHeaders: ['x-demo-trace-id', 'x-demo-span-id'],
  }),
)

app.use(express.json())

app.get('/health', (_request: Request, response: Response) => {
  response.json({ status: 'ok', serviceName, environment })
})

app.get('/api/clientes-demo.json', async (request: Request, response: Response) => {
  const incomingHeaders = propagation.fields().reduce<Record<string, string | undefined>>(
    (accumulator, headerName) => {
      const value = request.header(headerName)
      accumulator[headerName] = value ?? undefined
      return accumulator
    },
    {},
  )

  const extractedContext = propagation.extract(context.active(), request.headers)

  const result = await context.with(extractedContext, async () => {
    return tracer.startActiveSpan(
      'clientes.api.montar-carteira',
      {
        attributes: {
          feature: 'clientes',
          operation: 'montar-carteira-demo',
          'demo.request.query.ts': request.query.ts ? String(request.query.ts) : 'none',
          'demo.traceparent.recebido': incomingHeaders.traceparent ?? 'ausente',
        },
      },
      async (span) => {
        try {
          await new Promise((resolve) => {
            setTimeout(resolve, 220)
          })

          const activeSpan = trace.getActiveSpan()
          const spanContext = activeSpan?.spanContext() ?? span.spanContext()

          response.setHeader('x-demo-trace-id', spanContext.traceId)
          response.setHeader('x-demo-span-id', spanContext.spanId)

          const payload: CustomerPayload = {
            ...customerFixture,
            customers: customerFixture.customers.map((customer, index) => ({
              ...customer,
              status: index === 0 ? 'trace-correlacionado' : customer.status,
            })),
          }

          span.setStatus({ code: SpanStatusCode.OK })

          return {
            payload,
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
          }
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error(String(error))
          span.recordException(normalizedError)
          span.setStatus({ code: SpanStatusCode.ERROR, message: normalizedError.message })
          throw normalizedError
        } finally {
          span.end()
        }
      },
    )
  })

  response.json(result.payload)
})

const server = app.listen(port, () => {
  console.log(`[backend-api] listening on http://localhost:${port}`)
})

async function shutdown(signal: string): Promise<void> {
  console.log(`[backend-api] shutting down after ${signal}`)

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })

  await provider.forceFlush()
  await provider.shutdown()
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown(signal)
      .catch((error) => {
        console.error('[backend-api] shutdown failed', error)
        process.exitCode = 1
      })
      .finally(() => {
        process.exit()
      })
  })
}

process.on('uncaughtException', (error) => {
  console.error('[backend-api] uncaught exception', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('[backend-api] unhandled rejection', reason)
})