import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserPlus,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [showPassword, setShowPassword] =
    useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading) return

    setError('')

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (cleanName.length < 2) {
      setError('Inserisci il tuo nome.')
      return
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Inserisci un indirizzo email valido.')
      return
    }

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

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
            },
          },
        })

      if (signUpError) {
        const message =
          signUpError.message?.toLowerCase() || ''

        if (
          message.includes(
            'user already registered'
          )
        ) {
          setError(
            'Esiste già un account con questa email.'
          )
        } else {
          setError(
            signUpError.message ||
              'Impossibile completare la registrazione.'
          )
        }

        return
      }

      if (data?.session) {
        navigate('/account', {
          replace: true,
        })
        return
      }

      navigate('/login', {
        replace: true,
        state: {
          message:
            'Registrazione completata. Ti abbiamo inviato un’email: aprila e conferma il tuo indirizzo prima di accedere.',
        },
      })
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
    <main className="register-page">
      <section className="register-card">
        <div className="register-heading">
          <span className="register-kicker">
            Gli Acchiapasogni di Ery
          </span>

          <h1>Crea il tuo account</h1>

          <p>
            Registrati per avere il tuo spazio personale
            e utilizzare le funzioni dedicate ai clienti.
          </p>
        </div>

        {error && (
          <div className="register-error">
            {error}
          </div>
        )}

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>Nome e cognome</span>

            <div className="register-input-wrap">
              <User size={18} />

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Nome e cognome"
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>
          </label>

          <label>
            <span>Email</span>

            <div className="register-input-wrap">
              <Mail size={18} />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="La tua email"
                autoComplete="email"
                maxLength={200}
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>

            <div className="register-input-wrap">
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
                placeholder="Almeno 6 caratteri"
                autoComplete="new-password"
                minLength={6}
                required
              />

              <button
                type="button"
                className="register-password-toggle"
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

          <label>
            <span>Conferma password</span>

            <div className="register-input-wrap">
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
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            <UserPlus size={18} />

            {loading
              ? 'Registrazione in corso...'
              : 'Registrati'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Hai già un account?{' '}
            <Link to="/login">
              Accedi
            </Link>
          </p>
        </div>
      </section>

      <style>{`
        .register-page {
          min-height: 72vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 70px 20px;
          background:
            radial-gradient(
              circle at top right,
              rgba(214, 171, 160, 0.22),
              transparent 38%
            ),
            #fcfaf7;
        }

        .register-card {
          width: 100%;
          max-width: 500px;
          background: #fff;
          border: 1px solid rgba(68, 55, 49, 0.1);
          border-radius: 24px;
          padding: 38px;
          box-shadow:
            0 18px 55px rgba(68, 55, 49, 0.08);
        }

        .register-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .register-kicker {
          display: block;
          color: #9b6656;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .register-heading h1 {
          margin: 0 0 8px;
          color: #443731;
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 42px;
          line-height: 1.05;
          font-weight: 500;
        }

        .register-heading p {
          margin: 0;
          color: #83766f;
          line-height: 1.7;
          font-size: 14px;
        }

        .register-error {
          padding: 13px 15px;
          border-radius: 12px;
          margin-bottom: 18px;
          font-size: 13px;
          line-height: 1.5;
          background: #fff3f1;
          color: #9b463b;
          border: 1px solid #f1d1cb;
        }

        .register-form {
          display: grid;
          gap: 18px;
        }

        .register-form label > span {
          display: block;
          color: #443731;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .register-input-wrap {
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

        .register-input-wrap:focus-within {
          border-color: #9b6656;
          box-shadow:
            0 0 0 3px rgba(155, 102, 86, 0.1);
        }

        .register-input-wrap svg {
          flex: 0 0 auto;
          color: #9b6656;
        }

        .register-input-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #443731;
          font: inherit;
          font-size: 14px;
        }

        .register-input-wrap input::placeholder {
          color: #aaa09a;
        }

        .register-password-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          padding: 5px;
          background: transparent;
          color: #83766f;
          cursor: pointer;
        }

        .register-submit {
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

        .register-submit:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .register-submit:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .register-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 22px;
          border-top: 1px solid #eee8e4;
          color: #83766f;
          font-size: 13px;
        }

        .register-footer p {
          margin: 0;
        }

        .register-footer a {
          color: #9b6656;
          font-weight: 600;
          text-decoration: none;
        }

        .register-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .register-page {
            padding: 45px 15px;
            align-items: flex-start;
          }

          .register-card {
            padding: 28px 20px;
            border-radius: 19px;
          }

          .register-heading h1 {
            font-size: 36px;
          }
        }
      `}</style>
    </main>
  )
}

export default Register