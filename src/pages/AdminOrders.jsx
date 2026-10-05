import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  LoaderCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  User,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'

import { supabase } from '../supabaseClient'

const STATUS_OPTIONS = [
  {
    value: 'pending_payment',
    label: 'In attesa di pagamento',
  },
  {
    value: 'paid',
    label: 'Pagato',
  },
  {
    value: 'preparing',
    label: 'In preparazione',
  },
  {
    value: 'shipped',
    label: 'Spedito',
  },
  {
    value: 'delivered',
    label: 'Consegnato',
  },
  {
    value: 'cancelled',
    label: 'Annullato',
  },
  {
    value: 'refunded',
    label: 'Rimborsato',
  },
]

function money(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'

  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getStatusLabel(status) {
  return (
    STATUS_OPTIONS.find(
      (item) => item.value === status
    )?.label || status
  )
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] =
    useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } =
        await supabase
          .from('orders')
          .select('*')
          .order('created_at', {
            ascending: false,
          })

      if (loadError) {
        throw loadError
      }

      setOrders(data || [])
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile caricare gli ordini.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(
    orderId,
    newStatus
  ) {
    setUpdatingId(orderId)
    setError('')

    try {
      const { error: updateError } =
        await supabase
          .from('orders')
          .update({
            status: newStatus,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', orderId)

      if (updateError) {
        throw updateError
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updated_at:
                  new Date().toISOString(),
              }
            : order
        )
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          "Errore durante l'aggiornamento."
      )
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <main className="orders-loading">
        <LoaderCircle
          className="orders-spinner"
          size={34}
        />

        <span>Caricamento ordini...</span>

        <style>{styles}</style>
      </main>
    )
  }

  return (
    <main className="orders-page">
      <div className="container-ery">
        <div className="orders-top">
          <div>
            <Link
              to="/admin"
              className="orders-back"
            >
              <ArrowLeft size={16} />
              Amministrazione
            </Link>

            <span className="orders-kicker">
              Vendite
            </span>

            <h1>Ordini</h1>

            <p>
              Visualizza e gestisci gli ordini
              ricevuti dal negozio.
            </p>
          </div>

          <button
            type="button"
            className="btn-outline orders-refresh"
            onClick={loadOrders}
          >
            <RefreshCw size={15} />
            Aggiorna
          </button>
        </div>

        {error && (
          <div className="orders-error">
            {error}
          </div>
        )}

        <div className="orders-summary">
          <div>
            <ShoppingBag size={20} />
            <span>
              <strong>{orders.length}</strong>
              ordini
            </span>
          </div>

          <div>
            <Package size={20} />
            <span>
              <strong>
                {
                  orders.filter(
                    (order) =>
                      order.status ===
                        'paid' ||
                      order.status ===
                        'preparing'
                  ).length
                }
              </strong>
              da preparare
            </span>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <ShoppingBag size={35} />

            <h2>Nessun ordine</h2>

            <p>
              Gli ordini ricevuti compariranno
              qui.
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const items = Array.isArray(
                order.items
              )
                ? order.items
                : []

              return (
                <article
                  className="order-card"
                  key={order.id}
                >
                  <div className="order-head">
                    <div>
                      <span className="order-number">
                        Ordine
                      </span>

                      <h2>
                        {order.order_number ||
                          `#${String(
                            order.id
                          ).slice(0, 8)}`}
                      </h2>

                      <small>
                        {formatDate(
                          order.created_at
                        )}
                      </small>
                    </div>

                    <div
                      className={`order-status status-${order.status}`}
                    >
                      {getStatusLabel(
                        order.status
                      )}
                    </div>
                  </div>

                  <div className="order-grid">
                    <section>
                      <h3>Cliente</h3>

                      <div className="order-info">
                        <User size={15} />

                        <span>
                          {order.customer_name ||
                            '-'}
                        </span>
                      </div>

                      {order.customer_email && (
                        <div className="order-info">
                          <Mail size={15} />

                          <span>
                            {
                              order.customer_email
                            }
                          </span>
                        </div>
                      )}

                      {order.customer_phone && (
                        <div className="order-info">
                          <Phone size={15} />

                          <span>
                            {
                              order.customer_phone
                            }
                          </span>
                        </div>
                      )}

                      {(order.shipping_address ||
                        order.customer_address) && (
                        <div className="order-info">
                          <MapPin size={15} />

                          <span>
                            {order.shipping_address ||
                              order.customer_address}
                          </span>
                        </div>
                      )}
                    </section>

                    <section>
                      <h3>Prodotti</h3>

                      {items.length === 0 ? (
                        <p className="order-muted">
                          Nessun dettaglio
                          prodotto.
                        </p>
                      ) : (
                        <div className="order-items">
                          {items.map(
                            (item, index) => (
                              <div
                                className="order-item"
                                key={
                                  item.id ||
                                  index
                                }
                              >
                                <span>
                                  {item.name ||
                                    'Prodotto'}
                                </span>

                                <span>
                                  ×{' '}
                                  {Number(
                                    item.qty ||
                                      item.quantity ||
                                      1
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="order-totals">
                    <div>
                      <span>Subtotale</span>
                      <strong>
                        {money(
                          order.subtotal
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Spedizione</span>
                      <strong>
                        {money(
                          order.shipping
                        )}
                      </strong>
                    </div>

                    {Number(
                      order.discount || 0
                    ) > 0 && (
                      <div>
                        <span>Sconto</span>
                        <strong>
                          -
                          {money(
                            order.discount
                          )}
                        </strong>
                      </div>
                    )}

                    <div className="order-total">
                      <span>Totale</span>
                      <strong>
                        {money(order.total)}
                      </strong>
                    </div>
                  </div>

                  <div className="order-bottom">
                    <div>
                      <span className="order-label">
                        Pagamento
                      </span>

                      <strong>
                        {order.payment_status ===
                        'paid'
                          ? 'Pagato'
                          : order.payment_status ===
                              'unpaid'
                            ? 'Non pagato'
                            : order.payment_status ||
                              '-'}
                      </strong>
                    </div>

                    <label>
                      <span>
                        Stato ordine
                      </span>

                      <select
                        className="input-ery"
                        value={
                          order.status ||
                          'pending_payment'
                        }
                        disabled={
                          updatingId ===
                          order.id
                        }
                        onChange={(event) =>
                          updateStatus(
                            order.id,
                            event.target.value
                          )
                        }
                      >
                        {STATUS_OPTIONS.map(
                          (status) => (
                            <option
                              key={
                                status.value
                              }
                              value={
                                status.value
                              }
                            >
                              {status.label}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    {updatingId ===
                      order.id && (
                      <LoaderCircle
                        size={19}
                        className="orders-spinner"
                      />
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .orders-page {
    min-height: 75vh;
    padding: 45px 0 90px;
  }

  .orders-loading {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #81746e;
    font-size: 12px;
  }

  .orders-spinner {
    animation: orders-spin 1s linear infinite;
  }

  @keyframes orders-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .orders-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 25px;
    margin-bottom: 28px;
  }

  .orders-back {
    display: flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    margin-bottom: 22px;
    color: #81746e;
    text-decoration: none;
    font-size: 11px;
  }

  .orders-back:hover {
    color: var(--terracotta);
  }

  .orders-kicker {
    display: block;
    color: var(--terracotta);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
  }

  .orders-top h1 {
    margin: 4px 0 6px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 46px;
    font-weight: 500;
  }

  .orders-top p {
    margin: 0;
    color: #887c75;
    font-size: 12px;
  }

  .orders-refresh {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .orders-error {
    margin-bottom: 20px;
    padding: 13px 15px;
    border-radius: 12px;
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
    font-size: 11px;
  }

  .orders-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 25px;
  }

  .orders-summary > div {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 17px 19px;
    border: 1px solid rgba(112,83,70,.10);
    border-radius: 15px;
    background: white;
    color: var(--terracotta);
  }

  .orders-summary span {
    display: flex;
    flex-direction: column;
    color: #887c75;
    font-size: 10px;
  }

  .orders-summary strong {
    color: #4d413b;
    font-size: 19px;
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .order-card {
    overflow: hidden;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 20px;
    background: white;
    box-shadow: 0 8px 30px rgba(73,54,45,.04);
  }

  .order-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    padding: 21px 23px;
    border-bottom: 1px solid rgba(112,83,70,.08);
  }

  .order-number {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .order-head h2 {
    margin: 2px 0;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
  }

  .order-head small {
    color: #958a84;
    font-size: 9px;
  }

  .order-status {
    padding: 7px 10px;
    border-radius: 30px;
    background: #f4f0ed;
    color: #746963;
    font-size: 9px;
    font-weight: 700;
  }

  .status-paid,
  .status-delivered {
    background: rgba(98,145,104,.12);
    color: #56805b;
  }

  .status-preparing {
    background: rgba(199,156,69,.13);
    color: #95732e;
  }

  .status-shipped {
    background: rgba(82,121,166,.12);
    color: #4d7199;
  }

  .status-cancelled,
  .status-refunded {
    background: rgba(175,65,65,.09);
    color: #9d3e3e;
  }

  .order-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    padding: 22px 23px;
  }

  .order-grid h3 {
    margin: 0 0 12px;
    color: #51453f;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .7px;
  }

  .order-info {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 7px 0;
    color: #756a64;
    font-size: 11px;
    line-height: 1.5;
  }

  .order-info svg {
    flex: 0 0 auto;
    margin-top: 1px;
    color: var(--terracotta);
  }

  .order-items {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .order-item {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    color: #746963;
    font-size: 11px;
  }

  .order-muted {
    color: #958a84;
    font-size: 10px;
  }

  .order-totals {
    display: flex;
    justify-content: flex-end;
    gap: 25px;
    padding: 16px 23px;
    background: #fbf9f7;
  }

  .order-totals > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .order-totals span {
    color: #948983;
    font-size: 9px;
  }

  .order-totals strong {
    color: #5a4d47;
    font-size: 11px;
  }

  .order-total strong {
    color: var(--terracotta);
    font-size: 16px;
  }

  .order-bottom {
    display: flex;
    align-items: flex-end;
    gap: 20px;
    padding: 18px 23px 22px;
  }

  .order-bottom > div:first-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .order-label,
  .order-bottom label > span {
    display: block;
    margin-bottom: 5px;
    color: #948983;
    font-size: 9px;
    font-weight: 600;
  }

  .order-bottom strong {
    color: #5b504a;
    font-size: 11px;
  }

  .order-bottom label {
    width: 230px;
    margin-left: auto;
  }

  .order-bottom select {
    width: 100%;
  }

  .orders-empty {
    padding: 70px 20px;
    text-align: center;
    border: 1px solid rgba(112,83,70,.10);
    border-radius: 20px;
    background: white;
    color: #948983;
  }

  .orders-empty svg {
    color: var(--terracotta);
  }

  .orders-empty h2 {
    margin: 12px 0 5px;
    color: #51453f;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
  }

  .orders-empty p {
    margin: 0;
    font-size: 11px;
  }

  @media (max-width: 700px) {
    .orders-top {
      flex-direction: column;
    }

    .orders-refresh {
      width: 100%;
      justify-content: center;
    }

    .orders-summary {
      grid-template-columns: 1fr 1fr;
    }

    .order-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .order-totals {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .order-bottom {
      flex-direction: column;
      align-items: stretch;
    }

    .order-bottom label {
      width: 100%;
      margin-left: 0;
    }
  }

  @media (max-width: 430px) {
    .orders-summary {
      grid-template-columns: 1fr;
    }

    .order-head {
      flex-direction: column;
    }
  }
`

export default AdminOrders