import { useEffect, useState, type JSX } from 'react'
import {
  recordError,
  setMfeContext,
  withSpan,
} from '@ECADBR/plataforma-observability'
import './styles.css'

function PaymentItem({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="pagamentos-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function App(): JSX.Element {
  const [status, setStatus] = useState('Nenhum pagamento foi simulado.')
  const [incident, setIncident] = useState('sem incidentes recentes')

  useEffect(() => {
    setMfeContext({ mfeName: 'mfe-pagamentos', mfeVersion: '0.1.0-demo' })
  }, [])

  const handleFailure = async (): Promise<void> => {
    setStatus('Executando validação crítica do sandbox...')

    try {
      await withSpan(
        'feature.pagamentos.validar-autorizacao',
        {
          feature: 'pagamentos',
          operation: 'validar-autorizacao',
          gateway: 'sandbox-deny',
        },
        async () => {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 360)
          })

          throw new Error('Gateway de teste recusou a autorização do cartão corporativo.')
        },
      )
    } catch (error) {
      recordError(error, {
        feature: 'pagamentos',
        operation: 'registrar-falha',
        severity: 'high',
      })

      const message =
        error instanceof Error ? error.message : 'Falha desconhecida na autorização.'
      setIncident(message)
      setStatus('Erro controlado registrado com recordError para inspeção no Jaeger.')
    }
  }

  return (
    <section className="pagamentos-shell">
      <header className="pagamentos-header">
        <p className="pagamentos-eyebrow">remote de falha</p>
        <h3>Pagamentos com erro explícito e troubleshooting rápido</h3>
        <p>
          O botão abaixo força uma falha de autorização no sandbox e registra um erro
          padronizado usando a biblioteca.
        </p>
      </header>

      <button className="pagamentos-primary" onClick={() => void handleFailure()}>
        Forçar recusa controlada
      </button>

      <div className="pagamentos-grid">
        <PaymentItem label="estado do fluxo" value={status} />
        <PaymentItem label="último incidente" value={incident} />
      </div>
    </section>
  )
}