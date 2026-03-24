import { lazy, Suspense, useMemo, useState, type JSX, type ReactNode } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { createSpan } from '@ECADBR/plataforma-observability'
import { RouteTracker } from './RouteTracker'

const ClientesRemote = lazy(() => import('mfeClientes/App'))
const PagamentosRemote = lazy(() => import('mfePagamentos/App'))

const pulseMessages = [
  'Host confirmou a navegação e publicou um span manual.',
  'A sessão recebeu um pulso do host para facilitar a inspeção no Jaeger.',
  'O host marcou uma ação editorial para destacar o contexto da rota.',
]

function ShellCard({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string
  title: string
  body: string
  action?: ReactNode
}): JSX.Element {
  return (
    <article className="obs-demo-card">
      <p className="obs-demo-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </article>
  )
}

function RemoteStage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}): JSX.Element {
  return (
    <section className="obs-demo-stage">
      <header>
        <p className="obs-demo-eyebrow">Microfrontend carregado por federation</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <Suspense fallback={<div className="obs-demo-loading">Carregando remote...</div>}>
        {children}
      </Suspense>
    </section>
  )
}

function Dashboard({ onPulse, pulseResult }: { onPulse: () => Promise<void>; pulseResult: string }): JSX.Element {
  return (
    <div className="obs-demo-grid">
      <ShellCard
        eyebrow="Host inicializa OpenTelemetry"
        title="Um único provider, múltiplos MFEs"
        body="Esta demo centraliza a inicialização no host e usa remotes para provar contexto de rota, spans manuais, HTTP automático e erros controlados."
        action={
          <button className="obs-demo-button" onClick={() => void onPulse()}>
            Registrar pulso manual do host
          </button>
        }
      />

      <ShellCard
        eyebrow="O que observar"
        title="Rastreio legível no Jaeger"
        body="Procure pelo service.name demo-host-observability. Os spans do host devem carregar app.route, e os remotes devem acrescentar mfe.name e mfe.version."
      />

      <ShellCard
        eyebrow="Último pulso"
        title="Ação do host"
        body={pulseResult || 'Nenhum span manual do host foi emitido ainda.'}
      />
    </div>
  )
}

export default function App(): JSX.Element {
  const location = useLocation()
  const [pulseResult, setPulseResult] = useState('')

  const locationLabel = useMemo(() => {
    if (location.pathname === '/clientes') {
      return 'Clientes instrumentados'
    }

    if (location.pathname === '/pagamentos') {
      return 'Pagamentos com erro controlado'
    }

    return 'Painel editorial do host'
  }, [location.pathname])

  const handleHostPulse = async (): Promise<void> => {
    const span = createSpan('ui.host.registrar-pulso', {
      feature: 'host',
      operation: 'registrar-pulso',
      panel: 'observability-demo',
    })

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 260)
      })
      const message = pulseMessages[Math.floor(Math.random() * pulseMessages.length)]
      setPulseResult(message)
    } finally {
      span.end()
    }
  }

  return (
    <>
      <RouteTracker />
      <div className="obs-demo-app">
        <header className="obs-demo-hero">
          <div>
            <p className="obs-demo-kicker">plataforma-observability example suite</p>
            <h1>Host de observabilidade para microfrontends reais</h1>
          </div>
          <p className="obs-demo-hero-copy">
            Uma vitrine pequena, mas operacional, para inspecionar traces de navegação,
            spans manuais, instrumentação HTTP e erros vindos de remotes distintos.
          </p>
        </header>

        <nav className="obs-demo-nav" aria-label="Navegação principal da demo">
          <Link to="/" className={location.pathname === '/' ? 'is-active' : ''}>
            Host
          </Link>
          <Link to="/clientes" className={location.pathname === '/clientes' ? 'is-active' : ''}>
            MFE Clientes
          </Link>
          <Link to="/pagamentos" className={location.pathname === '/pagamentos' ? 'is-active' : ''}>
            MFE Pagamentos
          </Link>
        </nav>

        <section className="obs-demo-ribbon">
          <span>Rota atual observada</span>
          <strong>{location.pathname}</strong>
          <em>{locationLabel}</em>
        </section>

        <Routes>
          <Route
            path="/"
            element={<Dashboard onPulse={handleHostPulse} pulseResult={pulseResult} />}
          />
          <Route
            path="/clientes"
            element={
              <RemoteStage
                title="MFE Clientes"
                description="Este remote aciona withSpan e fetch para produzir, no mesmo fluxo, span manual e span HTTP automático."
              >
                <ClientesRemote />
              </RemoteStage>
            }
          />
          <Route
            path="/pagamentos"
            element={
              <RemoteStage
                title="MFE Pagamentos"
                description="Este remote força uma falha controlada e registra o erro usando recordError para facilitar troubleshooting."
              >
                <PagamentosRemote />
              </RemoteStage>
            }
          />
        </Routes>
      </div>
    </>
  )
}