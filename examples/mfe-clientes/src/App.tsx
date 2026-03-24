import { useEffect, useState, type JSX } from 'react'
import {
  createSpan,
  setMfeContext,
  withSpan,
} from '@ECADBR/plataforma-observability'
import './styles.css'

type CustomerPayload = {
  segment: string
  customers: Array<{
    id: string
    nome: string
    status: string
  }>
}

function StatRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="clientes-stat-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function resolveApiBaseUrl(): string {
  if (import.meta.env.VITE_MFE_CLIENTES_API_BASE_URL) {
    return import.meta.env.VITE_MFE_CLIENTES_API_BASE_URL
  }

  return new URL(import.meta.url).origin
}

export default function App(): JSX.Element {
  const [summary, setSummary] = useState('Nenhuma operação executada ainda.')
  const [lastCustomer, setLastCustomer] = useState('aguardando consulta')

  useEffect(() => {
    setMfeContext({ mfeName: 'mfe-clientes', mfeVersion: '0.1.0-demo' })
  }, [])

  const handleManualHighlight = async (): Promise<void> => {
    const span = createSpan('ui.clientes.destacar-carteira', {
      feature: 'clientes',
      operation: 'destacar-carteira',
      collection: 'premium-grid',
    })

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 180)
      })
      setSummary('Span manual curto emitido para destacar a carteira premium.')
    } finally {
      span.end()
    }
  }

  const handleObservedFetch = async (): Promise<void> => {
    try {
      const payload = await withSpan<CustomerPayload>(
        'feature.clientes.buscar-carteira',
        {
          feature: 'clientes',
          operation: 'buscar-carteira',
          audience: 'portfolio-operators',
        },
        async () => {
          const baseUrl = resolveApiBaseUrl()
          const response = await fetch(`${baseUrl}/api/clientes-demo.json?ts=${Date.now()}`)

          if (!response.ok) {
            throw new Error('Falha ao obter a carteira simulada de clientes.')
          }

          const result = (await response.json()) as CustomerPayload

          await new Promise((resolve) => {
            window.setTimeout(resolve, 420)
          })

          return result
        },
      )

      setLastCustomer(payload.customers[0]?.nome ?? 'sem registros')
      setSummary(
        `Consulta concluída. Segmento ${payload.segment} com ${payload.customers.length} clientes observados.`,
      )
    } catch (error) {
      setSummary(error instanceof Error ? error.message : 'Erro inesperado na consulta.')
    }
  }

  return (
    <section className="clientes-shell">
      <header className="clientes-header">
        <p className="clientes-eyebrow">remote de sucesso</p>
        <h3>Clientes com span manual e fetch automático</h3>
        <p>
          O clique principal usa withSpan e dispara uma chamada HTTP observada. Na
          demo integrada, essa chamada segue para um backend Node instrumentado e
          continua o mesmo trace distribuido.
        </p>
      </header>

      <div className="clientes-actions">
        <button className="clientes-primary" onClick={() => void handleObservedFetch()}>
          Buscar carteira observada
        </button>
        <button className="clientes-secondary" onClick={() => void handleManualHighlight()}>
          Registrar span manual curto
        </button>
      </div>

      <div className="clientes-panel">
        <StatRow label="último cliente" value={lastCustomer} />
        <StatRow label="status local" value={summary} />
      </div>
    </section>
  )
}