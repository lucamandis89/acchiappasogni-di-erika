import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  LogOut,
  Mail,
  Package,
  ShoppingBag,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

const STATUS_LABELS = {
  pending_payment: 'In attesa di pagamento',
  paid: 'Pagato',
  preparing: 'In preparazione',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
  refunded: 'Rimborsato',
}

function formatMoney(value) {
  const number = Number(value || 0)
  return `€ ${number.toFixed(2).replace('.', ',')}`
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function Account() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true

    async function loadAccount() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!currentUser) {
        navigate('/login', {
          replace: true,
          state: {
            message: 'Accedi per entrare nel tuo account.',
          },
        })
        return
      }

      setUser(currentUser)

      const { data: adminResult, error: adminError } =
        await supabase.rpc('is_admin')

      if (!active) return

      if (adminError) {
        console.error('Errore verifica amministratore:', adminError)
        setIsAdmin(false)
      } else {
        setIsAdmin(adminResult === true)
      }

      setLoading(false)

      const { data, error } = await supabase
        .from('orders')
        .select(
          'id, order_number, items, subtotal, shipping, discount, total, payment_status, status, tracking, created_at'
        )
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (!active) return

      if (error) {
        console.error('Errore caricamento ordini:', error)
        setOrdersError(
          'Non è stato possibile caricare i tuoi ordini.'
        )
        setOrders([])
      } else {
        setOrders(data || [])
      }

      setOrdersLoading(false)
    }

    loadAccount()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          navigate('/login', {
            replace: true,
          })
        } else {
          setUser(session.user)
          setLoading(false)
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [navigate])

  async function handleLogout() {
    if (loggingOut) return

    try {
      setLoggingOut(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error(error)
        setLoggingOut(false)
        return
      }

      navigate('/', { replace: true })
    } catch (error) {
      console.error(error)
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <main className="account-loading">
        <div className="account-spinner" />
        <p>Caricamento account...</p>

        <style>{`
          .account-loading {
            min-height: 65vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            color: #83766f;
          }

          .account-spinner {
            width: 34px;
            height: 34px;
            border: 3px solid #eadfda;
            border-top-color: #9b6656;
            border-radius: 50%;
            animation: account-spin 0.8s linear infinite;
          }

          @keyframes account-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    )
  }

  if (!user) return null

  const fullName =
    user.user_metadata?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'Cliente'

  const initial = fullName.charAt(0).toUpperCase()

  return (
    <main className="account-page">
      <div className="account-container">
        <section className="account-welcome">
          <div className="account-avatar">{initial}</div>

          <div className="account-welcome-text">
            <span>Il mio account</span>
            <h1>Ciao, {fullName}</h1>
            <p>
              Da qui puoi accedere alle funzioni dedicate
              al tuo profilo.
            </p>
          </div>

          <button
            type="button"
            className="account-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={17} />
            {loggingOut ? 'Uscita...' : 'Esci'}
          </button>
        </section>

        <section className="account-grid">
          <article className="account-card account-profile">
            <div className="account-icon">
              <User size={22} />
            </div>

            <h2>I tuoi dati</h2>

            <div className="account-info">
              <div>
                <span>Nome</span>
                <strong>{fullName}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong className="account-email">
                  <Mail size={15} />
                  {user.email}
                </strong>
              </div>
            </div>
          </article>

          <Link
            to="/preferiti"
            className="account-card account-link-card"
          >
            <div className="account-icon">
              <Heart size={22} />
            </div>

            <h2>I miei preferiti</h2>
            <p>
              Ritrova gli acchiappasogni che hai salvato
              nel cuore.
            </p>
            <span className="account-open">
              Apri preferiti →
            </span>
          </Link>

          <Link
            to="/shop"
            className="account-card account-link-card"
          >
            <div className="account-icon">
              <ShoppingBag size={22} />
            </div>

            <h2>Scopri lo Shop</h2>
            <p>
              Esplora le creazioni disponibili e trova il
              tuo prossimo acchiappasogni.
            </p>
            <span className="account-open">
              Vai allo Shop →
            </span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="account-card account-link-card account-admin-card"
            >
              <div className="account-icon">
                <ShieldCheck size={22} />
              </div>

              <h2>Area amministratore</h2>
              <p>
                Gestisci prodotti, ordini, categorie e le altre
                funzioni riservate del negozio.
              </p>
              <span className="account-open">
                Apri amministrazione →
              </span>
            </Link>
          )}
        </section>

        <section className="orders-section">
          <div className="orders-heading">
            <div>
              <span>I tuoi acquisti</span>
              <h2>I miei ordini</h2>
              <p>
                Qui trovi gli ordini effettuati con questo
                account e il loro stato.
              </p>
            </div>

            <div className="orders-heading-icon">
              <Package size={24} />
            </div>
          </div>

          {ordersLoading ? (
            <div className="orders-state">
              Caricamento ordini...
            </div>
          ) : ordersError ? (
            <div className="orders-state orders-error">
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <div className="orders-empty">
              <ShoppingBag size={30} />
              <h3>Non hai ancora ordini</h3>
              <p>
                Quando effettuerai un ordine lo troverai
                qui.
              </p>
              <Link to="/shop" className="btn-primary">
                Vai allo Shop
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const items = Array.isArray(order.items)
                  ? order.items
                  : []

                const status =
                  STATUS_LABELS[order.status] ||
                  order.status ||
                  'Stato non disponibile'

                return (
                  <article
                    className="order-card"
                    key={order.id}
                  >
                    <div className="order-top">
                      <div>
                        <span>Ordine</span>
                        <strong>
                          {order.order_number}
                        </strong>
                      </div>

                      <div className="order-date">
                        {formatDate(order.created_at)}
                      </div>

                      <div
                        className={`order-status status-${order.status || 'unknown'}`}
                      >
                        {status}
                      </div>
                    </div>

                    <div className="order-products">
                      {items.map((item, index) => (
                        <div
                          className="order-product"
                          key={`${order.id}-${item.id || index}`}
                        >
                          <div className="order-product-image">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name || 'Prodotto'}
                              />
                            ) : (
                              <span>ERY</span>
                            )}
                          </div>

                          <div className="order-product-info">
                            <strong>
                              {item.name || 'Creazione'}
                            </strong>
                            <span>
                              Quantità:{' '}
                              {item.quantity ||
                                item.qty ||
                                1}
                            </span>
                          </div>

                          <strong className="order-product-price">
                            {formatMoney(
                              Number(item.price || 0) *
                                Number(
                                  item.quantity ||
                                    item.qty ||
                                    1
                                )
                            )}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="order-summary-account">
                      <div>
                        <span>Subtotale</span>
                        <strong>
                          {formatMoney(order.subtotal)}
                        </strong>
                      </div>

                      <div>
                        <span>Spedizione</span>
                        <strong>
                          {Number(order.shipping || 0) === 0
                            ? 'Gratuita'
                            : formatMoney(order.shipping)}
                        </strong>
                      </div>

                      {Number(order.discount || 0) > 0 && (
                        <div>
                          <span>Sconto</span>
                          <strong>
                            - {formatMoney(order.discount)}
                          </strong>
                        </div>
                      )}

                      <div className="order-total-account">
                        <span>Totale</span>
                        <strong>
                          {formatMoney(order.total)}
                        </strong>
                      </div>
                    </div>

                    {order.tracking && (
                      <div className="order-tracking">
                        <Truck size={17} />
                        <span>Tracking:</span>
                        <strong>{order.tracking}</strong>
                      </div>
                    )}

                    {order.status ===
                      'pending_payment' && (
                      <div className="order-pending-note">
                        Questo ordine non risulta ancora
                        pagato. Se hai abbandonato il
                        pagamento, verrà annullato
                        automaticamente.
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="account-note">
          <Heart size={18} />
          <p>
            Ogni creazione nasce a mano, con cura e
            attenzione ai dettagli.
          </p>
        </section>
      </div>

      <style>{`
        .account-page {
          min-height: 70vh;
          padding: 65px 20px 90px;
          background:
            radial-gradient(
              circle at top left,
              rgba(214, 171, 160, 0.2),
              transparent 34%
            ),
            #fcfaf7;
        }

        .account-container {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
        }

        .account-welcome {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 30px;
          background: #fff;
          border: 1px solid rgba(68, 55, 49, 0.09);
          border-radius: 24px;
          box-shadow:
            0 14px 45px rgba(68, 55, 49, 0.06);
          margin-bottom: 24px;
        }

        .account-avatar {
          width: 70px;
          height: 70px;
          flex: 0 0 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #9b6656;
          color: #fff;
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 600;
        }

        .account-welcome-text {
          flex: 1;
          min-width: 0;
        }

        .account-welcome-text > span,
        .orders-heading > div > span {
          color: #9b6656;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          font-size: 11px;
          font-weight: 600;
        }

        .account-welcome-text h1 {
          margin: 3px 0 5px;
          color: #443731;
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          line-height: 1.05;
          font-weight: 500;
        }

        .account-welcome-text p {
          margin: 0;
          color: #83766f;
          font-size: 14px;
          line-height: 1.6;
        }

        .account-logout {
          min-height: 42px;
          padding: 0 17px;
          border: 1px solid #d9cec8;
          border-radius: 11px;
          background: #fff;
          color: #725b51;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
        }

        .account-logout:hover {
          border-color: #9b6656;
          color: #9b6656;
        }

        .account-logout:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .account-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .account-card {
          background: #fff;
          border: 1px solid rgba(68, 55, 49, 0.09);
          border-radius: 20px;
          padding: 25px;
          min-height: 215px;
          box-shadow:
            0 10px 35px rgba(68, 55, 49, 0.045);
        }

        .account-icon,
        .orders-heading-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6ece8;
          color: #9b6656;
        }

        .account-icon {
          margin-bottom: 18px;
        }

        .account-card h2 {
          margin: 0 0 10px;
          color: #443731;
          font-family: 'Cormorant Garamond', serif;
          font-size: 27px;
          font-weight: 600;
        }

        .account-card p {
          margin: 0;
          color: #83766f;
          font-size: 13px;
          line-height: 1.7;
        }

        .account-info {
          display: grid;
          gap: 14px;
          margin-top: 17px;
        }

        .account-info > div {
          display: grid;
          gap: 3px;
        }

        .account-info span {
          color: #9b8d85;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .account-info strong {
          color: #51443e;
          font-size: 13px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .account-email {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .account-link-card {
          text-decoration: none;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .account-admin-card {
          border-color: rgba(155, 102, 86, 0.22);
          background: #fffaf7;
        }

        .account-link-card:hover {
          transform: translateY(-3px);
          border-color: rgba(155, 102, 86, 0.3);
          box-shadow:
            0 16px 42px rgba(68, 55, 49, 0.08);
        }

        .account-open {
          display: inline-block;
          margin-top: 20px;
          color: #9b6656;
          font-size: 13px;
          font-weight: 700;
        }

        .orders-section {
          margin-top: 28px;
          padding: 30px;
          background: #fff;
          border: 1px solid rgba(68, 55, 49, 0.09);
          border-radius: 24px;
          box-shadow:
            0 14px 45px rgba(68, 55, 49, 0.05);
        }

        .orders-heading {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          padding-bottom: 22px;
          border-bottom: 1px solid rgba(68, 55, 49, 0.09);
        }

        .orders-heading h2 {
          margin: 4px 0 4px;
          color: #443731;
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 600;
        }

        .orders-heading p {
          margin: 0;
          color: #83766f;
          font-size: 13px;
        }

        .orders-state,
        .orders-empty {
          padding: 42px 10px 15px;
          text-align: center;
          color: #83766f;
        }

        .orders-error {
          color: #9d3e3e;
        }

        .orders-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
        }

        .orders-empty > svg {
          color: #9b6656;
        }

        .orders-empty h3 {
          margin: 4px 0 0;
          color: #443731;
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
        }

        .orders-empty p {
          margin: 0 0 10px;
          font-size: 13px;
        }

        .orders-list {
          display: grid;
          gap: 18px;
          margin-top: 22px;
        }

        .order-card {
          overflow: hidden;
          border: 1px solid rgba(68, 55, 49, 0.1);
          border-radius: 18px;
          background: #fffdfa;
        }

        .order-top {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 18px;
          padding: 17px 19px;
          background: #faf5f1;
        }

        .order-top > div:first-child {
          display: grid;
          gap: 2px;
        }

        .order-top > div:first-child span {
          color: #9b8d85;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .order-top > div:first-child strong {
          color: #51443e;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .order-date {
          color: #8b7d75;
          font-size: 11px;
          white-space: nowrap;
        }

        .order-status {
          padding: 7px 10px;
          border-radius: 999px;
          background: #eee8e4;
          color: #725b51;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
          white-space: nowrap;
        }

        .status-paid,
        .status-delivered {
          background: rgba(139, 151, 136, 0.16);
          color: #63705f;
        }

        .status-preparing,
        .status-shipped {
          background: rgba(198, 157, 83, 0.14);
          color: #876c35;
        }

        .status-cancelled,
        .status-refunded {
          background: rgba(160, 90, 75, 0.11);
          color: #914c40;
        }

        .order-products {
          display: grid;
          gap: 12px;
          padding: 18px 19px;
        }

        .order-product {
          display: grid;
          grid-template-columns: 54px 1fr auto;
          align-items: center;
          gap: 12px;
        }

        .order-product-image {
          width: 54px;
          height: 54px;
          overflow: hidden;
          border-radius: 11px;
          background: #f3efeb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9b6656;
          font-family: 'Cormorant Garamond', serif;
        }

        .order-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .order-product-info {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .order-product-info strong {
          color: #51443e;
          font-size: 12px;
        }

        .order-product-info span {
          color: #958983;
          font-size: 10px;
        }

        .order-product-price {
          color: #51443e;
          font-size: 12px;
          white-space: nowrap;
        }

        .order-summary-account {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 16px 19px;
          border-top: 1px solid rgba(68, 55, 49, 0.08);
          background: #fff;
        }

        .order-summary-account > div {
          display: grid;
          gap: 3px;
        }

        .order-summary-account span {
          color: #958983;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .order-summary-account strong {
          color: #51443e;
          font-size: 12px;
        }

        .order-total-account strong {
          color: #9b6656;
          font-size: 15px;
        }

        .order-tracking {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 13px 19px;
          border-top: 1px solid rgba(68, 55, 49, 0.08);
          color: #725b51;
          font-size: 11px;
        }

        .order-tracking svg {
          color: #9b6656;
        }

        .order-pending-note {
          padding: 12px 19px;
          border-top: 1px solid rgba(68, 55, 49, 0.08);
          background: rgba(198, 157, 83, 0.08);
          color: #806c46;
          font-size: 10px;
          line-height: 1.5;
        }

        .account-note {
          margin-top: 24px;
          padding: 18px 22px;
          border-radius: 16px;
          background: #f7efeb;
          color: #725b51;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          text-align: center;
        }

        .account-note p {
          margin: 0;
          font-size: 13px;
        }

        @media (max-width: 850px) {
          .account-grid {
            grid-template-columns: 1fr;
          }

          .account-card {
            min-height: auto;
          }

          .order-summary-account {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .account-page {
            padding: 40px 15px 65px;
          }

          .account-welcome {
            align-items: flex-start;
            flex-wrap: wrap;
            padding: 23px 20px;
          }

          .account-avatar {
            width: 58px;
            height: 58px;
            flex-basis: 58px;
            font-size: 28px;
          }

          .account-welcome-text h1 {
            font-size: 33px;
          }

          .account-logout {
            width: 100%;
          }

          .orders-section {
            padding: 21px 16px;
          }

          .orders-heading h2 {
            font-size: 30px;
          }

          .order-top {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .order-date {
            white-space: normal;
          }

          .order-status {
            width: fit-content;
          }

          .order-product {
            grid-template-columns: 48px 1fr;
          }

          .order-product-image {
            width: 48px;
            height: 48px;
          }

          .order-product-price {
            grid-column: 2;
          }

          .order-summary-account {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  )
}

export default Account
