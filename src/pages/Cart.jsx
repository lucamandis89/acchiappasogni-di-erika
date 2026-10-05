import { Link } from 'react-router-dom'
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

function Cart({
  cart,
  onSetQty,
  onRemove,
}) {
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  )

  if (cart.length === 0) {
    return (
      <main className="cart-empty-page">
        <div className="container-ery cart-empty">
          <div className="cart-empty-icon">
            <ShoppingBag size={42} />
          </div>

          <h1>Il tuo carrello è vuoto</h1>

          <p>
            Scopri le creazioni di Erika e scegli
            l'acchiappasogni che fa per te.
          </p>

          <Link to="/shop" className="btn-primary">
            Vai allo Shop
            <ArrowRight size={17} />
          </Link>
        </div>

        <style>{cartStyles}</style>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <div className="container-ery">
        <Link to="/shop" className="cart-back">
          <ArrowLeft size={16} />
          Continua gli acquisti
        </Link>

        <div className="cart-title">
          <span>Le tue creazioni</span>
          <h1>Carrello</h1>
          <p>
            {cart.reduce(
              (sum, item) => sum + Number(item.qty || 1),
              0
            )}{' '}
            articoli nel carrello
          </p>
        </div>

        <div className="cart-layout">
          <section className="cart-items">
            {cart.map((item) => {
              const qty = Number(item.qty || 1)
              const madeToOrder = Boolean(item.madeToOrder)
              const maxStock = madeToOrder
                ? 1
                : Number(item.maxStock || 999)

              return (
                <article className="cart-item" key={item.id}>
                  <Link
                    to={`/prodotto/${item.id}`}
                    className="cart-image"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <div className="cart-no-image">
                        ERY
                      </div>
                    )}
                  </Link>

                  <div className="cart-item-info">
                    <Link to={`/prodotto/${item.id}`}>
                      <h2>{item.name}</h2>
                    </Link>

                    <div className="cart-unit-price">
                      € {Number(item.price || 0).toFixed(2)}
                    </div>

                    {madeToOrder && (
                      <div className="cart-made-to-order">
                        Su ordinazione
                      </div>
                    )}

                    <div className="cart-item-bottom">
                      <div className="cart-quantity">
                        <button
                          type="button"
                          aria-label="Diminuisci quantità"
                          disabled={qty <= 1}
                          onClick={() =>
                            onSetQty(item.id, qty - 1)
                          }
                        >
                          <Minus size={15} />
                        </button>

                        <strong>{qty}</strong>

                        <button
                          type="button"
                          aria-label="Aumenta quantità"
                          disabled={qty >= maxStock}
                          onClick={() =>
                            onSetQty(item.id, qty + 1)
                          }
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 size={16} />
                        Rimuovi
                      </button>
                    </div>
                  </div>

                  <div className="cart-line-total">
                    € {(Number(item.price || 0) * qty).toFixed(2)}
                  </div>
                </article>
              )
            })}
          </section>

          <aside className="cart-summary">
            <span className="cart-summary-kicker">
              Riepilogo
            </span>

            <h2>Il tuo ordine</h2>

            <div className="summary-line">
              <span>Subtotale</span>
              <strong>€ {subtotal.toFixed(2)}</strong>
            </div>

            <div className="summary-line">
              <span>Spedizione</span>
              <span>Calcolata al checkout</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Totale parziale</span>
              <strong>€ {subtotal.toFixed(2)}</strong>
            </div>

            <p className="summary-note">
              Le eventuali spese di spedizione e gli sconti
              verranno calcolati prima del pagamento.
            </p>

            <Link
              to="/checkout"
              className="btn-primary checkout-button"
            >
              Procedi al checkout
              <ArrowRight size={17} />
            </Link>

            <div className="cart-guarantees">
              <span>♡ Creazioni fatte a mano</span>
              <span>✦ Ordine preparato con cura</span>
            </div>
          </aside>
        </div>
      </div>

      <style>{cartStyles}</style>
    </main>
  )
}

const cartStyles = `
  .cart-page {
    min-height: 70vh;
    padding: 42px 0 90px;
  }

  .cart-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 30px;
    color: var(--terracotta);
    font-size: 13px;
    font-weight: 600;
  }

  .cart-title {
    margin-bottom: 35px;
  }

  .cart-title > span,
  .cart-summary-kicker {
    color: var(--terracotta);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .cart-title h1 {
    margin: 6px 0 4px;
    color: #443731;
    font-size: 55px;
    font-weight: 500;
  }

  .cart-title p {
    margin: 0;
    color: #8a7d76;
    font-size: 12px;
  }

  .cart-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(300px, .65fr);
    gap: 38px;
    align-items: start;
  }

  .cart-items {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }

  .cart-item {
    display: grid;
    grid-template-columns: 130px minmax(0, 1fr) auto;
    gap: 20px;
    align-items: center;
    padding: 15px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 20px;
    background: white;
  }

  .cart-image {
    width: 130px;
    height: 130px;
    overflow: hidden;
    border-radius: 15px;
    background: #f3efeb;
  }

  .cart-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cart-no-image {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--terracotta);
    font-family: 'Cormorant Garamond', serif;
    font-size: 25px;
  }

  .cart-item-info h2 {
    margin: 0 0 5px;
    color: #443731;
    font-size: 25px;
    font-weight: 600;
  }

  .cart-unit-price {
    margin-bottom: 10px;
    color: var(--terracotta);
    font-size: 13px;
    font-weight: 700;
  }

  .cart-made-to-order {
    display: inline-flex;
    margin-bottom: 12px;
    padding: 5px 9px;
    border-radius: 999px;
    background: rgba(139,151,136,.15);
    color: #63705f;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .4px;
  }

  .cart-item-bottom {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .cart-quantity {
    display: flex;
    align-items: center;
    overflow: hidden;
    border: 1px solid rgba(112,83,70,.18);
    border-radius: 999px;
  }

  .cart-quantity button {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: var(--terracotta);
  }

  .cart-quantity button:disabled {
    opacity: .3;
    cursor: not-allowed;
  }

  .cart-quantity strong {
    min-width: 29px;
    text-align: center;
    font-size: 12px;
  }

  .cart-remove {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #9b7065;
    font-size: 11px;
  }

  .cart-line-total {
    align-self: center;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 23px;
    font-weight: 700;
  }

  .cart-summary {
    position: sticky;
    top: 105px;
    padding: 28px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 24px;
    background: white;
    box-shadow: 0 12px 35px rgba(73,54,45,.06);
  }

  .cart-summary h2 {
    margin: 5px 0 25px;
    color: #443731;
    font-size: 32px;
    font-weight: 500;
  }

  .summary-line {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin: 13px 0;
    color: #746963;
    font-size: 12px;
  }

  .summary-line strong {
    color: #443731;
  }

  .summary-divider {
    height: 1px;
    margin: 21px 0;
    background: rgba(112,83,70,.12);
  }

  .summary-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
  }

  .summary-total span {
    font-size: 13px;
    font-weight: 600;
  }

  .summary-total strong {
    color: var(--terracotta);
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
  }

  .summary-note {
    margin: 15px 0 20px;
    color: #928680;
    font-size: 10px;
    line-height: 1.6;
  }

  .checkout-button {
    width: 100%;
  }

  .cart-guarantees {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-top: 20px;
    color: var(--sage);
    font-size: 10px;
    font-weight: 600;
  }

  .cart-empty-page {
    min-height: 72vh;
    display: flex;
    align-items: center;
  }

  .cart-empty {
    padding: 80px 0;
    text-align: center;
  }

  .cart-empty-icon {
    width: 85px;
    height: 85px;
    margin: 0 auto 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(224,169,155,.2);
    color: var(--terracotta);
  }

  .cart-empty h1 {
    margin-bottom: 10px;
    color: #443731;
    font-size: 48px;
    font-weight: 500;
  }

  .cart-empty p {
    max-width: 480px;
    margin: 0 auto 27px;
    color: #776b65;
    line-height: 1.7;
  }

  @media (max-width: 850px) {
    .cart-layout {
      grid-template-columns: 1fr;
    }

    .cart-summary {
      position: static;
    }
  }

  @media (max-width: 580px) {
    .cart-page {
      padding-top: 25px;
    }

    .cart-title h1 {
      font-size: 45px;
    }

    .cart-item {
      grid-template-columns: 92px minmax(0, 1fr);
      gap: 13px;
    }

    .cart-image {
      width: 92px;
      height: 92px;
    }

    .cart-item-info h2 {
      font-size: 20px;
    }

    .cart-item-bottom {
      align-items: flex-start;
      flex-direction: column;
      gap: 9px;
    }

    .cart-line-total {
      grid-column: 2;
      justify-self: end;
      margin-top: -27px;
      font-size: 19px;
    }
  }
`

export default Cart