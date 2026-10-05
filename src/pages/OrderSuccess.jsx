import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  LoaderCircle,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

function OrderSuccess({ onPaymentSuccess }) {
  const [searchParams] = useSearchParams()

  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState('checking')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  const clearedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let retryTimer = null

    const verifyPayment = async (attempt = 0) => {
      if (!sessionId) {
        if (!cancelled) {
          setStatus('error')
          setError(
            'Non è stato possibile verificare il pagamento: sessione mancante.'
          )
        }

        return
      }

      try {
        const { data, error: functionError } =
          await supabase.functions.invoke(
            'verify-checkout-session',
            {
              body: {
                sessionId,
              },
            }
          )

        if (cancelled) return

        if (functionError) {
          throw functionError
        }

        /*
         * Stripe può riportare il cliente sul sito
         * pochi istanti prima che il webhook abbia
         * terminato di aggiornare l'ordine.
         *
         * In quel caso riproviamo automaticamente.
         */
        if (data?.processing === true) {
          if (attempt < 5) {
            retryTimer = setTimeout(() => {
              verifyPayment(attempt + 1)
            }, 1500)

            return
          }

          setStatus('processing')
          return
        }

        if (data?.verified !== true) {
          setStatus('error')
          setError(
            'Il pagamento non risulta ancora confermato.'
          )

          return
        }

        setOrder({
          orderNumber: data.orderNumber || '',
          total: Number(data.total || 0),
          status: data.status || '',
        })

        setStatus('success')

        /*
         * Il carrello viene svuotato SOLO dopo
         * che Stripe + Supabase hanno confermato
         * realmente il pagamento.
         */
        if (
          !clearedRef.current &&
          typeof onPaymentSuccess === 'function'
        ) {
          clearedRef.current = true
          onPaymentSuccess()
        }
      } catch (err) {
        console.error(
          'Errore verifica pagamento:',
          err
        )

        if (!cancelled) {
          setStatus('error')
          setError(
            'Si è verificato un problema durante la verifica del pagamento.'
          )
        }
      }
    }

    verifyPayment()

    return () => {
      cancelled = true

      if (retryTimer) {
        clearTimeout(retryTimer)
      }
    }
  }, [sessionId, onPaymentSuccess])

  const money = (value) =>
    new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(value || 0))

  if (status === 'checking') {
    return (
      <main className="success-page">
        <div className="success-card">
          <div className="success-icon checking">
            <LoaderCircle
              size={48}
              className="spin"
            />
          </div>

          <span className="success-kicker">
            Verifica pagamento
          </span>

          <h1>Un momento...</h1>

          <p>
            Stiamo verificando il pagamento e
            confermando il tuo ordine.
          </p>
        </div>

        <PageStyles />
      </main>
    )
  }

  if (status === 'processing') {
    return (
      <main className="success-page">
        <div className="success-card">
          <div className="success-icon checking">
            <LoaderCircle
              size={48}
              className="spin"
            />
          </div>

          <span className="success-kicker">
            Pagamento ricevuto
          </span>

          <h1>Ordine in elaborazione</h1>

          <p>
            Il pagamento è stato ricevuto, ma
            stiamo ancora completando la conferma
            dell'ordine.
          </p>

          <div className="success-note">
            Attendi qualche secondo e aggiorna
            questa pagina.
          </div>

          <button
            type="button"
            className="btn-primary retry-button"
            onClick={() => window.location.reload()}
          >
            Aggiorna pagina
          </button>
        </div>

        <PageStyles />
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="success-page">
        <div className="success-card">
          <div className="success-icon error">
            <AlertCircle size={48} />
          </div>

          <span className="success-kicker">
            Verifica ordine
          </span>

          <h1>Verifica non completata</h1>

          <p>
            {error}
          </p>

          <div className="success-note">
            Se hai appena effettuato il pagamento,
            non effettuare subito un secondo ordine.
            Controlla prima la conferma del pagamento.
          </div>

          <div className="success-actions">
            <button
              type="button"
              className="btn-primary retry-button"
              onClick={() => window.location.reload()}
            >
              Riprova
            </button>

            <Link
              to="/"
              className="btn-outline"
            >
              Torna alla Home
            </Link>
          </div>
        </div>

        <PageStyles />
      </main>
    )
  }

  return (
    <main className="success-page">
      <div className="success-card">
        <div className="success-icon">
          <CheckCircle2 size={48} />
        </div>

        <span className="success-kicker">
          Grazie per il tuo acquisto
        </span>

        <h1>Ordine ricevuto!</h1>

        <p>
          Il pagamento è stato verificato e
          completato.
          <br />
          Abbiamo ricevuto il tuo ordine e
          inizieremo presto a preparare la tua
          creazione.
        </p>

        {order?.orderNumber && (
          <div className="order-info">
            <span>Numero ordine</span>
            <strong>
              {order.orderNumber}
            </strong>

            {order.total > 0 && (
              <>
                <span>Totale pagato</span>
                <strong>
                  {money(order.total)}
                </strong>
              </>
            )}
          </div>
        )}

        <div className="success-note">
          Riceverai gli aggiornamenti relativi al
          tuo ordine all'indirizzo email indicato
          durante l'acquisto.
        </div>

        <div className="success-actions">
          <Link
            to="/"
            className="btn-primary"
          >
            Torna alla Home
          </Link>

          <Link
            to="/shop"
            className="btn-outline"
          >
            <ShoppingBag size={16} />
            Continua lo shopping
          </Link>
        </div>
      </div>

      <PageStyles />
    </main>
  )
}

function PageStyles() {
  return (
    <style>{`
      .success-page {
        min-height: 72vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px 20px 90px;
      }

      .success-card {
        width: 100%;
        max-width: 650px;
        padding: 55px 40px;
        text-align: center;
        border: 1px solid rgba(112,83,70,.11);
        border-radius: 28px;
        background: white;
        box-shadow: 0 15px 50px rgba(73,54,45,.07);
      }

      .success-icon {
        width: 90px;
        height: 90px;
        margin: 0 auto 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(144,153,139,.13);
        color: var(--sage);
      }

      .success-icon.checking {
        background: rgba(224,169,155,.12);
        color: var(--terracotta);
      }

      .success-icon.error {
        background: rgba(180,80,70,.09);
        color: #a65349;
      }

      .success-kicker {
        color: var(--terracotta);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }

      .success-card h1 {
        margin: 8px 0 18px;
        color: #443731;
        font-family: 'Cormorant Garamond', serif;
        font-size: 52px;
        font-weight: 500;
      }

      .success-card > p {
        margin: 0 auto;
        color: #756963;
        font-size: 13px;
        line-height: 1.8;
      }

      .order-info {
        margin: 28px auto 0;
        max-width: 380px;
        padding: 18px 20px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px 20px;
        text-align: left;
        border: 1px solid rgba(112,83,70,.10);
        border-radius: 15px;
        background: #fffdfb;
        color: #776a64;
        font-size: 12px;
      }

      .order-info strong {
        color: #443731;
        text-align: right;
      }

      .success-note {
        margin: 28px 0;
        padding: 17px 20px;
        border-radius: 15px;
        background: rgba(224,169,155,.10);
        color: #776a64;
        font-size: 11px;
        line-height: 1.6;
      }

      .success-actions {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .success-actions a,
      .retry-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
      }

      .retry-button {
        border: 0;
        cursor: pointer;
        font-family: inherit;
      }

      .spin {
        animation: success-spin 1s linear infinite;
      }

      @keyframes success-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 600px) {
        .success-card {
          padding: 40px 22px;
        }

        .success-card h1 {
          font-size: 43px;
        }

        .success-actions {
          flex-direction: column;
        }

        .success-actions a,
        .retry-button {
          width: 100%;
        }

        .order-info {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .order-info strong {
          text-align: center;
          margin-bottom: 5px;
        }
      }
    `}</style>
  )
}

export default OrderSuccess