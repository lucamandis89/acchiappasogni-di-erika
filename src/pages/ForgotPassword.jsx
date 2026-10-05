import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Send,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading) return

    setError('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Inserisci un indirizzo email valido.')
      return
    }

    try {
      setLoading(true)

      const redirectTo =
        `${window.location.origin}/reimposta-password`

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo,
          }
        )

      if (resetError) {
        console.error(resetError)
        setError(
          'Non è stato possibile inviare l’email. Riprova tra qualche istante.'
        )
        return
      }

      setSent(true)
    } catch (err) {
      console.error(err)

      setError(
        'Si è verificato un errore. Riprova tra qualche istante.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="forgot-page">
      <section className="forgot-card">
        {!sent ? (
          <>
            <div className="forgot-heading">
              <span className="forgot-kicker">
                Gli Acchiapasogni di Ery
              </span>

              <h1>Password dimenticata?</h1>

              <p>
                Inserisci l’email del tuo account.
                Ti invieremo il collegamento per
                scegliere una nuova password.
              </p>
            </div>

            {error && (
              <div className="forgot-error">
                {error}
              </div>
            )}

            <form
              className="forgot-form"
              onSubmit={handleSubmit}
            >
              <label>
                <span>Email</span>

                <div className="forgot-input-wrap">
                  <Mail size={18} />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="La tua email"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                className="forgot-submit"
                disabled={loading}
              >
                <Send size={18} />

                {loading
                  ? 'Invio in corso...'
                  : 'Invia email di recupero'}
              </button>
            </form>
          </>
        ) : (
          <div className="forgot-success">
            <div className="forgot-success-icon">
              <CheckCircle2 size={34} />
            </div>

            <h1>Controlla la tua email</h1>

            <p>
              Se esiste un account associato a
              <strong> {email}</strong>, riceverai
              il collegamento per reimpostare la
              password.
            </p>
          </div>
        )}

        <div className="forgot-footer">
          <Link to="/login">
            <ArrowLeft size={15} />
            Torna all’accesso
          </Link>
        </div>
      </section>

      <style>{`
        .forgot-page {
          min-height: 72vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 70px 20px;
          background:
            radial-gradient(
              circle at top left,
              rgba(214, 171, 160, 0.22),
              transparent 38%
            ),
            #fcfaf7;
        }

        .forgot-card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border: 1px solid rgba(68, 55, 49, 0.1);
          border-radius: 24px;
          padding: 38px;
          box-shadow:
            0 18px 55px rgba(68, 55, 49, 0.08);
        }

        .forgot-heading,
        .forgot-success {
          text-align: center;
        }

        .forgot-kicker {
          display: block;
          color: #9b6656;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .forgot-heading h1,
        .forgot-success h1 {
          margin: 0 0 10px;
          color: #443731;
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 40px;
          line-height: 1.05;
          font-weight: 500;
        }

        .forgot-heading p,
        .forgot-success p {
          margin: 0;
          color: #83766f;
          line-height: 1.7;
          font-size: 14px;
        }

        .forgot-error {
          margin-top: 22px;
          padding: 13px 15px;
          border-radius: 12px;
          background: #fff3f1;
          color: #9b463b;
          border: 1px solid #f1d1cb;
          font-size: 13px;
        }

        .forgot-form {
          display: grid;
          gap: 18px;
          margin-top: 26px;
        }

        .forgot-form label > span {
          display: block;
          color: #443731;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .forgot-input-wrap {
          min-height: 50px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #ded7d2;
          border-radius: 13px;
          padding: 0 14px;
          background: #fff;
        }

        .forgot-input-wrap:focus-within {
          border-color: #9b6656;
          box-shadow:
            0 0 0 3px rgba(155, 102, 86, 0.1);
        }

        .forgot-input-wrap svg {
          color: #9b6656;
          flex: 0 0 auto;
        }

        .forgot-input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #443731;
          font: inherit;
          font-size: 14px;
        }

        .forgot-submit {
          min-height: 52px;
          border: 0;
          border-radius: 13px;
          background: #9b6656;
          color: #fff;
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .forgot-submit:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .forgot-success-icon {
          width: 70px;
          height: 70px;
          margin: 0 auto 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef5ea;
          color: #61765a;
        }

        .forgot-success strong {
          color: #443731;
        }

        .forgot-footer {
          text-align: center;
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid #eee8e4;
        }

        .forgot-footer a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #9b6656;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        @media (max-width: 600px) {
          .forgot-page {
            padding: 45px 15px;
            align-items: flex-start;
          }

          .forgot-card {
            padding: 28px 20px;
            border-radius: 19px;
          }

          .forgot-heading h1,
          .forgot-success h1 {
            font-size: 35px;
          }
        }
      `}</style>
    </main>
  )
}

export default ForgotPassword