import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import { supabase } from '../supabaseClient'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const message = location.state?.message || ''

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading) return

    setError('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      setError('Inserisci email e password.')
      return
    }

    try {
      setLoading(true)

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

      if (signInError) {
        if (
          signInError.message
            ?.toLowerCase()
            .includes('email not confirmed')
        ) {
          setError(
            'Devi prima confermare il tuo indirizzo email. Controlla la posta ricevuta.'
          )
        } else if (
          signInError.message
            ?.toLowerCase()
            .includes('invalid login credentials')
        ) {
          setError('Email o password non corretti.')
        } else {
          setError(
            signInError.message ||
              'Impossibile effettuare l’accesso.'
          )
        }

        return
      }

      navigate('/account', { replace: true })
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
    <main className="login-page">
      <section className="login-card">
        <div className="login-heading">
          <span className="login-kicker">
            Gli Acchiapasogni di Ery
          </span>

          <h1>Accedi</h1>

          <p>
            Entra nel tuo account per gestire i tuoi dati
            e, presto, i tuoi preferiti e le tue richieste.
          </p>
        </div>

        {message && (
          <div className="login-message">
            {message}
          </div>
        )}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>Email</span>

            <div className="login-input-wrap">
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

          <label>
            <span>Password</span>

            <div className="login-input-wrap">
              <Lock size={18} />

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="La tua password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showPassword
                    ? 'Nascondi password'
                    : 'Mostra password'
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            <LogIn size={18} />

            {loading
              ? 'Accesso in corso...'
              : 'Accedi'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/password-dimenticata">
            Password dimenticata?
          </Link>

          <p>
            Non hai ancora un account?
            {' '}
            <Link to="/registrati">
              Registrati
            </Link>
          </p>
        </div>
      </section>

      <style>{`
        .login-page {
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

        .login-card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border: 1px solid rgba(68, 55, 49, 0.1);
          border-radius: 24px;
          padding: 38px;
          box-shadow:
            0 18px 55px rgba(68, 55, 49, 0.08);
        }

        .login-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-kicker {
          display: block;
          color: #9b6656;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .login-heading h1 {
          margin: 0 0 8px;
          color: #443731;
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 44px;
          font-weight: 500;
        }

        .login-heading p {
          margin: 0;
          color: #83766f;
          line-height: 1.7;
          font-size: 14px;
        }

        .login-message,
        .login-error {
          padding: 13px 15px;
          border-radius: 12px;
          margin-bottom: 18px;
          font-size: 13px;
          line-height: 1.5;
        }

        .login-message {
          background: #f0f6ed;
          color: #53664d;
          border: 1px solid #d9e7d4;
        }

        .login-error {
          background: #fff3f1;
          color: #9b463b;
          border: 1px solid #f1d1cb;
        }

        .login-form {
          display: grid;
          gap: 18px;
        }

        .login-form label > span {
          display: block;
          color: #443731;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .login-input-wrap {
          min-height: 50px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #ded7d2;
          border-radius: 13px;
          padding: 0 14px;
          background: #fff;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .login-input-wrap:focus-within {
          border-color: #9b6656;
          box-shadow:
            0 0 0 3px rgba(155, 102, 86, 0.1);
        }

        .login-input-wrap svg {
          flex: 0 0 auto;
          color: #9b6656;
        }

        .login-input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #443731;
          font: inherit;
          font-size: 14px;
        }

        .login-input-wrap input::placeholder {
          color: #aaa09a;
        }

        .password-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          padding: 5px;
          background: transparent;
          color: #83766f;
          cursor: pointer;
        }

        .login-submit {
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
          margin-top: 4px;
          transition:
            transform 0.2s ease,
            opacity 0.2s ease;
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .login-submit:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .login-links {
          text-align: center;
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #eee8e4;
          color: #83766f;
          font-size: 13px;
        }

        .login-links > a {
          display: inline-block;
          margin-bottom: 13px;
        }

        .login-links p {
          margin: 0;
        }

        .login-links a {
          color: #9b6656;
          font-weight: 600;
          text-decoration: none;
        }

        .login-links a:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .login-page {
            padding: 45px 15px;
            align-items: flex-start;
          }

          .login-card {
            padding: 28px 20px;
            border-radius: 19px;
          }

          .login-heading h1 {
            font-size: 38px;
          }
        }
      `}</style>
    </main>
  )
}

export default Login