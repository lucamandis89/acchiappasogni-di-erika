import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogIn,
  LogOut,
  LoaderCircle,
  Package,
  ShoppingBag,
  ShieldCheck,
  Tags,
  TicketPercent,
  Star,
  Mail,
  HelpCircle,
  Truck,
} from 'lucide-react'

import { supabase } from '../supabaseClient'

function Admin() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)

  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    checkCurrentUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkCurrentUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function checkCurrentUser() {
    setLoading(true)

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        setUser(null)
        setIsAdmin(false)
        return
      }

      setUser(currentUser)

      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()

      if (profileError) {
        console.error(profileError)
        setIsAdmin(false)
        return
      }

      setIsAdmin(profile?.role === 'admin')
    } catch (err) {
      console.error(err)
      setUser(null)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()

    setError('')
    setLoginLoading(true)

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (loginError) {
        throw loginError
      }

      await checkCurrentUser()
    } catch (err) {
      console.error(err)

      setError(
        err?.message === 'Invalid login credentials'
          ? 'Email o password non corretti.'
          : err?.message ||
              'Impossibile effettuare il login.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()

    setUser(null)
    setIsAdmin(false)
    setEmail('')
    setPassword('')
  }

  if (loading) {
    return (
      <main className="admin-loading">
        <LoaderCircle
          className="admin-spinner"
          size={34}
        />

        <span>
          Caricamento area amministrazione...
        </span>

        <style>{styles}</style>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-icon">
            <ShieldCheck size={32} />
          </div>

          <span className="admin-kicker">
            Acchiappasogni ERY
          </span>

          <h1>Area Admin</h1>

          <p>
            Accedi per gestire prodotti, ordini e
            contenuti del negozio.
          </p>

          <form onSubmit={handleLogin}>
            <label>
              <span>Email</span>

              <input
                className="input-ery"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>Password</span>

              <input
                className="input-ery"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <div className="admin-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary admin-login-button"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="admin-spinner"
                  />
                  Accesso...
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  Accedi
                </>
              )}
            </button>
          </form>
        </div>

        <style>{styles}</style>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-icon">
            <ShieldCheck size={32} />
          </div>

          <h1>Accesso negato</h1>

          <p>
            Questo account non dispone dei permessi
            di amministrazione.
          </p>

          <button
            type="button"
            className="btn-outline admin-login-button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Esci
          </button>
        </div>

        <style>{styles}</style>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <div className="container-ery">
        <header className="admin-header">
          <div>
            <span className="admin-kicker">
              Acchiappasogni ERY
            </span>

            <h1>Amministrazione</h1>

            <p>
              Gestisci il tuo negozio da computer,
              tablet o telefono.
            </p>
          </div>

          <button
            type="button"
            className="btn-outline admin-logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Esci
          </button>
        </header>

        <section className="admin-welcome">
          <ShieldCheck size={20} />

          <div>
            <strong>
              Accesso amministratore attivo
            </strong>
            <span>{user.email}</span>
          </div>
        </section>

        <section className="admin-grid">
          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/prodotti')
            }
          >
            <div className="admin-action-icon">
              <Package size={25} />
            </div>

            <div>
              <span>Catalogo</span>
              <h2>Prodotti</h2>
              <p>
                Aggiungi, modifica e gestisci gli
                acchiappasogni.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/ordini')
            }
          >
            <div className="admin-action-icon">
              <ShoppingBag size={25} />
            </div>

            <div>
              <span>Vendite</span>
              <h2>Ordini</h2>
              <p>
                Visualizza e gestisci gli ordini
                ricevuti.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/categorie')
            }
          >
            <div className="admin-action-icon">
              <Tags size={25} />
            </div>

            <div>
              <span>Catalogo</span>
              <h2>Categorie</h2>
              <p>
                Crea, modifica e organizza le
                categorie dello Shop.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/coupon')
            }
          >
            <div className="admin-action-icon">
              <TicketPercent size={25} />
            </div>

            <div>
              <span>Promozioni</span>
              <h2>Coupon</h2>
              <p>
                Crea e gestisci codici sconto,
                scadenze e limiti di utilizzo.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/recensioni')
            }
          >
            <div className="admin-action-icon">
              <Star size={25} />
            </div>

            <div>
              <span>Clienti</span>
              <h2>Recensioni</h2>
              <p>
                Controlla, approva e gestisci le
                recensioni dei clienti.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/messaggi')
            }
          >
            <div className="admin-action-icon">
              <Mail size={25} />
            </div>

            <div>
              <span>Clienti</span>
              <h2>Messaggi</h2>
              <p>
                Leggi e gestisci le richieste
                ricevute dal modulo Contatti.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/faq')
            }
          >
            <div className="admin-action-icon">
              <HelpCircle size={25} />
            </div>

            <div>
              <span>Contenuti</span>
              <h2>FAQ</h2>
              <p>
                Crea, modifica e gestisci le
                domande frequenti del sito.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/spedizioni')
            }
          >
            <div className="admin-action-icon">
              <Truck size={25} />
            </div>

            <div>
              <span>Negozio</span>
              <h2>Spedizioni</h2>
              <p>
                Imposta il costo di spedizione e
                la soglia per la spedizione gratuita.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/progetti')
            }
          >
            <div className="admin-action-icon">
              <Mail size={25} />
            </div>

            <div>
              <span>Personalizzazioni</span>
              <h2>Progetti personalizzati</h2>
              <p>
                Visualizza e gestisci le richieste
                di acchiappasogni personalizzati.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="admin-action-card"
            onClick={() =>
              navigate('/admin/configuratore')
            }
          >
            <div className="admin-action-icon">
              <Star size={25} />
            </div>

            <div>
              <span>Configuratore</span>
              <h2>Libreria configuratore</h2>
              <p>
                Gestisci forme, immagini, prezzi e
                opzioni disponibili nel configuratore.
              </p>
            </div>
          </button>
        </section>
      </div>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .admin-loading {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #776a64;
    font-size: 12px;
  }

  .admin-spinner {
    animation: admin-spin 1s linear infinite;
  }

  @keyframes admin-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .admin-login-page {
    min-height: 75vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 50px 20px 80px;
  }

  .admin-login-card {
    width: 100%;
    max-width: 430px;
    padding: 40px;
    border: 1px solid rgba(112,83,70,.12);
    border-radius: 25px;
    background: white;
    box-shadow: 0 15px 50px rgba(73,54,45,.07);
  }

  .admin-login-icon {
    width: 65px;
    height: 65px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(224,169,155,.15);
    color: var(--terracotta);
  }

  .admin-kicker {
    color: var(--terracotta);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .admin-login-card h1,
  .admin-header h1 {
    margin: 5px 0 8px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px;
    font-weight: 500;
  }

  .admin-login-card > p,
  .admin-header p {
    margin: 0 0 25px;
    color: #83766f;
    font-size: 12px;
    line-height: 1.6;
  }

  .admin-login-card label {
    display: block;
    margin-bottom: 17px;
  }

  .admin-login-card label > span {
    display: block;
    margin-bottom: 7px;
    color: #615650;
    font-size: 11px;
    font-weight: 600;
  }

  .admin-login-button {
    width: 100%;
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }

  .admin-login-button:disabled {
    opacity: .65;
    cursor: wait;
  }

  .admin-error {
    margin-bottom: 16px;
    padding: 11px 13px;
    border-radius: 11px;
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
    font-size: 11px;
  }

  .admin-page {
    min-height: 75vh;
    padding: 50px 0 90px;
  }

  .admin-header {
    display: flex;
    justify-content: space-between;
    gap: 25px;
    align-items: flex-start;
    margin-bottom: 30px;
  }

  .admin-header p {
    margin-bottom: 0;
  }

  .admin-logout {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .admin-welcome {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 30px;
    padding: 15px 18px;
    border-radius: 14px;
    background: rgba(144,153,139,.10);
    color: var(--sage);
  }

  .admin-welcome div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .admin-welcome strong {
    color: #59514c;
    font-size: 11px;
  }

  .admin-welcome span {
    color: #8a7f79;
    font-size: 10px;
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }

  .admin-action-card {
    width: 100%;
    padding: 25px;
    display: flex;
    gap: 17px;
    text-align: left;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 20px;
    background: white;
    cursor: pointer;
    box-shadow: 0 8px 30px rgba(73,54,45,.04);
    transition: .2s ease;
  }

  .admin-action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(73,54,45,.08);
  }

  .admin-action-icon {
    width: 48px;
    height: 48px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(224,169,155,.15);
    color: var(--terracotta);
  }

  .admin-action-card span {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .admin-action-card h2 {
    margin: 3px 0 6px;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 27px;
  }

  .admin-action-card p {
    margin: 0;
    color: #8b8079;
    font-size: 11px;
    line-height: 1.5;
  }

  @media (max-width: 700px) {
    .admin-login-card {
      padding: 28px 22px;
    }

    .admin-header {
      flex-direction: column;
    }

    .admin-grid {
      grid-template-columns: 1fr;
    }

    .admin-logout {
      width: 100%;
      justify-content: center;
    }
  }
`

export default Admin