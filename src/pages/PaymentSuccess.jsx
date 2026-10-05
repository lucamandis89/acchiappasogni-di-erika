import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Home,
  ShoppingBag,
} from 'lucide-react'

function PaymentSuccess() {
  return (
    <main className="payment-success-page">
      <div className="container-ery">
        <div className="payment-success-card">
          <div className="success-icon">
            <CheckCircle2 size={48} />
          </div>

          <span className="success-kicker">
            Grazie per il tuo acquisto
          </span>

          <h1>Ordine ricevuto!</h1>

          <p className="success-main-text">
            Il pagamento è stato inviato correttamente.
            Stiamo preparando il tuo ordine.
          </p>

          <div className="success-info">
            <ShoppingBag size={20} />

            <div>
              <strong>Gli Acchiapasogni di Ery</strong>
              <p>
                Riceverai gli aggiornamenti relativi al tuo
                ordine all'indirizzo email indicato durante
                l'acquisto.
              </p>
            </div>
          </div>

          <Link to="/" className="btn-primary success-button">
            <Home size={16} />
            Torna alla Home
          </Link>

          <p className="success-small">
            Grazie per aver scelto una creazione
            artigianale fatta con cura e passione.
          </p>
        </div>
      </div>

      <style>{`
        .payment-success-page {
          min-height: 75vh;
          display: flex;
          align-items: center;
          padding: 70px 0 90px;
        }

        .payment-success-card {
          max-width: 650px;
          margin: 0 auto;
          padding: 55px 45px;
          border: 1px solid rgba(112,83,70,.11);
          border-radius: 28px;
          background: white;
          box-shadow:
            0 15px 50px rgba(73,54,45,.07);
          text-align: center;
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

        .success-kicker {
          color: var(--terracotta);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .payment-success-card h1 {
          margin: 8px 0 14px;
          color: #443731;
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 52px;
          font-weight: 500;
        }

        .success-main-text {
          max-width: 480px;
          margin: 0 auto;
          color: #81756f;
          font-size: 14px;
          line-height: 1.7;
        }

        .success-info {
          margin: 30px 0;
          padding: 20px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          border-radius: 17px;
          background: rgba(224,169,155,.10);
          text-align: left;
        }

        .success-info > svg {
          flex: 0 0 auto;
          margin-top: 2px;
          color: var(--terracotta);
        }

        .success-info strong {
          color: #51453f;
          font-size: 13px;
        }

        .success-info p {
          margin: 5px 0 0;
          color: #887b74;
          font-size: 11px;
          line-height: 1.6;
        }

        .success-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .success-small {
          margin: 24px 0 0;
          color: #a0958e;
          font-size: 10px;
        }

        @media (max-width: 600px) {
          .payment-success-page {
            padding: 40px 0 70px;
          }

          .payment-success-card {
            padding: 40px 22px;
          }

          .payment-success-card h1 {
            font-size: 43px;
          }
        }
      `}</style>
    </main>
  )
}

export default PaymentSuccess