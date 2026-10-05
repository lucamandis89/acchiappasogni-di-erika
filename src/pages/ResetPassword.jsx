import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [showPassword, setShowPassword] =
    useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading) return

    setError('')

    if (password.length < 6) {
      setError(
        'La password deve contenere almeno 6 caratteri.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Le due password non coincidono.')
      return
    }

    try {
      setLoading(true)

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        })

      if (updateError) {
        console.error(updateError)

        setError(
          'Il collegamento potrebbe essere scaduto o non valido. Richiedi una nuova email di recupero.'
        )
        return
      }

      setSuccess(true)

      setTimeout(() => {
        navigate('/account', {
          replace: true,
        })
      }, 1800)
    } catch (err) {
      console.error(err)

      setError(
        'Si è verificato un errore. Riprova.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="reset-page">
      <section className="reset-card">
        {!success ? (
          <>
            <div className="reset-heading">
              <span>Gli Acchiapasogni di Ery</span>

              <h1>Nuova password</h1>

              <p>
                Scegli una nuova password per il tuo
                account.
              </p>
            </div>

            {error && (
              <div className="reset-error">
                {error}
              </div>
            )}

            <form
              className="reset-form"
              onSubmit={handleSubmit}
            >
              <label>
                <span>Nuova password</span>

                <div className="reset-input">
                  <Lock size={18} />

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Almeno 6 caratteri"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label="Mostra o nascondi password"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              <label>
                <span>Conferma password</span>

                <div className="reset-input">
                  <Lock size={18} />

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Ripeti la password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              </label>

              <button
                className="reset-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Salvataggio...'
                  : 'Salva nuova password'}
              </button>
            </form>
          </>
        ) : (
          <div className="reset-success">
            <CheckCircle2 size={48} />

            <h1>Password aggiornata</h1>

            <p>
              La nuova password è stata salvata
              correttamente.
            </p>

            <p>
              Ti stiamo portando nel tuo account...
            </p>
          </div>
        )}

        <div className="reset-footer">
          <Link to="/login">
            Torna all’accesso
          </Link>
        </div>
      </section>

      <style>{`
        .reset-page {
          min-height: 72vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 70px 20px;
          background: #fcfaf7;
        }

        .reset-card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border: 1px solid rgba(68,55,49,.1);
          border-radius: 24px;
          padding: 38px;
          box-shadow:
            0 18px 55px rgba(68,55,49,.08);
        }

        .reset-heading,
        .reset-success {
          text-align: center;
        }

        .reset-heading > span {
          color: #9b6656;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-size: 11px;
          font-weight: 600;
        }

        .reset-heading h1,
        .reset-success h1 {
          margin: 8px 0 8px;
          color: #443731;
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 40px;
          font-weight: 500;
        }

        .reset-heading p,
        .reset-success p {
          color: #83766f;
          font-size: 14px;
          line-height: 1.7;
        }

        .reset-error {
          margin-top: 22px;
          padding: 13px 15px;
          border-radius: 12px;
          background: #fff3f1;
          color: #9b463b;
          border: 1px solid #f1d1cb;
          font-size: 13px;
        }

        .reset-form {
          display: grid;
          gap: 18px;
          margin-top: 26px;
        }

        .reset-form label > span {
          display: block;
          margin-bottom: 7px;
          color: #443731;
          font-size: 13px;
          font-weight: 600;
        }

        .reset-input {
          min-height: 50px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border: 1px solid #ded7d2;
          border-radius: 13px;
        }

        .reset-input:focus-within {
          border-color: #9b6656;
          box-shadow:
            0 0 0 3px rgba(155,102,86,.1);
        }

        .reset-input svg {
          color: #9b6656;
          flex-shrink: 0;
        }

        .reset-input input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #443731;
          font: inherit;
          font-size: 14px;
        }

        .reset-input button {
          border: 0;
          background: transparent;
          padding: 5px;
          color: #83766f;
          cursor: pointer;
          display: flex;
        }

        .reset-submit {
          min-height: 52px;
          border: 0;
          border-radius: 13px;
          background: #9b6656;
          color: #fff;
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .reset-submit:disabled {
          opacity: .65;
          cursor: wait;
        }

        .reset-success > svg {
          color: #61765a;
          margin-bottom: 8px;
        }

        .reset-footer {
          text-align: center;
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid #eee8e4;
        }

        .reset-footer a {
          color: #9b6656;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        @media (max-width: 600px) {
          .reset-page {
            padding: 45px 15px;
            align-items: flex-start;
          }

          .reset-card {
            padding: 28px 20px;
            border-radius: 19px;
          }

          .reset-heading h1,
          .reset-success h1 {
            font-size: 35px;
          }
        }
      `}</style>
    </main>
  )
}

export default ResetPassword