import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShoppingBag,
  LoaderCircle,
  TicketPercent,
  CheckCircle2,
  X,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

function Checkout({ cart = [] }) {
  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    cap: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [error, setError] = useState('')

  const [shippingCost, setShippingCost] = useState(0)
  const [freeShippingThreshold, setFreeShippingThreshold] =
    useState(0)

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.qty || 1),
    0
  )

  const freeShipping =
    freeShippingThreshold > 0 &&
    subtotal >= freeShippingThreshold

  const appliedShipping =
    freeShipping ? 0 : shippingCost

  const couponDiscount =
    appliedCoupon &&
    appliedCoupon.subtotal === subtotal
      ? appliedCoupon.discount
      : 0

  const total = Math.max(
    0,
    subtotal + appliedShipping - couponDiscount
  )

  useEffect(() => {
    let cancelled = false

    function getPosteBasePrice(weightKg) {
      if (weightKg <= 1) return 5.65
      if (weightKg <= 2) return 5.9
      if (weightKg <= 3) return 6.7
      if (weightKg <= 5) return 7.3
      if (weightKg <= 10) return 10.4
      if (weightKg <= 15) return 11.7
      if (weightKg <= 20) return 12.3
      if (weightKg <= 25) return 14.8
      if (weightKg <= 30) return 14.8
      if (weightKg <= 40) return 28.3
      if (weightKg <= 50) return 32.3
      if (weightKg <= 70) return 39.7

      throw new Error(
        'Il peso dell’ordine supera il limite massimo di spedizione.'
      )
    }

    async function loadShippingEstimate() {
      setSettingsLoading(true)
      setError('')

      try {
        const productIds = [
          ...new Set(cart.map((item) => item.id)),
        ]

        if (productIds.length === 0) {
          if (!cancelled) {
            setShippingCost(0)
            setFreeShippingThreshold(0)
          }
          return
        }

        const [
          { data: settings, error: settingsError },
          { data: products, error: productsError },
        ] = await Promise.all([
          supabase
            .from('store_settings')
            .select('free_shipping_threshold')
            .limit(1)
            .maybeSingle(),

          supabase
            .from('products')
            .select(`
              id,
              name,
              shipping_weight_grams,
              package_length_cm,
              package_width_cm,
              package_height_cm
            `)
            .in('id', productIds),
        ])

        if (settingsError) throw settingsError
        if (productsError) throw productsError

        if (
          !products ||
          products.length !== productIds.length
        ) {
          throw new Error(
            'Non è stato possibile calcolare la spedizione.'
          )
        }

        let totalWeightGrams = 0
        let packageLength = 0
        let packageWidth = 0
        let packageHeight = 0

        for (const cartItem of cart) {
          const product = products.find(
            (item) => item.id === cartItem.id
          )

          if (!product) {
            throw new Error(
              'Prodotto non disponibile per il calcolo della spedizione.'
            )
          }

          const quantity = Math.max(
            1,
            Math.floor(Number(cartItem.qty || 1))
          )

          const weight = Number(
            product.shipping_weight_grams
          )
          const length = Number(
            product.package_length_cm
          )
          const width = Number(
            product.package_width_cm
          )
          const height = Number(
            product.package_height_cm
          )

          if (
            !Number.isFinite(weight) ||
            weight <= 0 ||
            !Number.isFinite(length) ||
            length <= 0 ||
            !Number.isFinite(width) ||
            width <= 0 ||
            !Number.isFinite(height) ||
            height <= 0
          ) {
            throw new Error(
              `Dati di spedizione mancanti per "${product.name}".`
            )
          }

          totalWeightGrams += weight * quantity
          packageLength = Math.max(
            packageLength,
            length
          )
          packageWidth = Math.max(
            packageWidth,
            width
          )
          packageHeight += height * quantity
        }

        const totalWeightKg =
          totalWeightGrams / 1000

        const baseShipping =
          getPosteBasePrice(totalWeightKg)

        const dimensionsSum =
          packageLength +
          packageWidth +
          packageHeight

        const longestSide = Math.max(
          packageLength,
          packageWidth,
          packageHeight
        )

        if (
          longestSide > 280 ||
          dimensionsSum > 450
        ) {
          throw new Error(
            'Le dimensioni dell’ordine superano i limiti di Poste Delivery Web.'
          )
        }

        let bulkySupplement = 0

        if (
          longestSide > 150 ||
          dimensionsSum > 220
        ) {
          bulkySupplement = 40
        } else if (
          longestSide > 100 ||
          dimensionsSum > 150
        ) {
          bulkySupplement = 9
        }

        const calculatedShipping = Number(
          (
            baseShipping +
            1 +
            bulkySupplement
          ).toFixed(2)
        )

        const threshold = Number(
          settings?.free_shipping_threshold
        )

        if (!cancelled) {
          setShippingCost(calculatedShipping)

          setFreeShippingThreshold(
            Number.isFinite(threshold) &&
              threshold > 0
              ? threshold
              : 0
          )
        }
      } catch (err) {
        console.error(
          'Errore calcolo spedizione:',
          err
        )

        if (!cancelled) {
          setShippingCost(0)
          setError(
            err?.message ||
              'Non è stato possibile calcolare le spese di spedizione.'
          )
        }
      } finally {
        if (!cancelled) {
          setSettingsLoading(false)
        }
      }
    }

    loadShippingEstimate()

    return () => {
      cancelled = true
    }
  }, [cart])

  useEffect(() => {
    setAppliedCoupon(null)
    setCouponError('')
  }, [subtotal])

  function updateField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function applyCoupon() {
    if (couponLoading || loading) return

    const code = couponCode.trim().toUpperCase()

    setCouponError('')
    setAppliedCoupon(null)

    if (!code) {
      setCouponError('Inserisci un codice coupon.')
      return
    }

    setCouponLoading(true)

    try {
      /*
       * La verifica avviene tramite una funzione
       * del server. Non leggiamo direttamente
       * i coupon dal browser.
       */
      const { data, error: functionError } =
        await supabase.functions.invoke(
          'validate-checkout-coupon',
          {
            body: {
              code,
              items: cart.map((item) => ({
                id: item.id,
                qty: Number(item.qty || 1),
              })),
            },
          }
        )

      if (functionError) {
        throw functionError
      }

      if (data?.valid !== true) {
        throw new Error(
          data?.message || 'Coupon non valido.'
        )
      }

      setAppliedCoupon({
        code: data.code || code,
        discount: Number(data.discount || 0),
        subtotal,
      })

      setCouponCode(data.code || code)
    } catch (err) {
      console.error('Errore coupon:', err)

      setCouponError(
        err?.message ||
          'Non è stato possibile verificare il coupon.'
      )
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading || couponLoading || settingsLoading) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const customerName =
        `${form.name.trim()} ${form.surname.trim()}`.trim()

      const { data, error: functionError } =
        await supabase.functions.invoke(
          'create-checkout-session',
          {
            body: {
              customer: {
                name: customerName,
                email: form.email.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                city: form.city.trim(),
                province: form.province
                  .trim()
                  .toUpperCase(),
                cap: form.cap.trim(),
              },

              items: cart.map((item) => ({
                id: item.id,
                qty: Number(item.qty || 1),
              })),

              couponCode:
                appliedCoupon?.code || '',

              notes: form.notes.trim(),

              successUrl:
                `${window.location.origin}/ordine-confermato`,

              cancelUrl:
                `${window.location.origin}/checkout`,
            },
          }
        )

      if (functionError) {
        const response =
          functionError.context instanceof Response
            ? await functionError.context
                .json()
                .catch(() => null)
            : null

        throw new Error(
          response?.error ||
            functionError.message
        )
      }

      if (!data?.url) {
        throw new Error(
          data?.error ||
            'Stripe non ha restituito la pagina di pagamento.'
        )
      }

      window.location.href = data.url
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Non è stato possibile avviare il pagamento. Riprova.'
      )

      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <main className="checkout-empty">
        <div className="container-ery checkout-empty-box">
          <ShoppingBag size={42} />

          <h1>Il carrello è vuoto</h1>

          <p>
            Aggiungi almeno una creazione prima
            di procedere al checkout.
          </p>

          <Link to="/shop" className="btn-primary">
            Vai allo Shop
          </Link>
        </div>

        <style>{styles}</style>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <div className="container-ery">
        <Link to="/carrello" className="checkout-back">
          <ArrowLeft size={16} />
          Torna al carrello
        </Link>

        <header className="checkout-heading">
          <span>Il tuo ordine</span>
          <h1>Checkout</h1>

          <p>
            Inserisci i dati per la consegna
            della tua creazione.
          </p>
        </header>

        <form
          className="checkout-layout"
          onSubmit={handleSubmit}
        >
          <div className="checkout-form">
            <section className="checkout-card">
              <div className="section-title">
                <div className="section-icon">
                  <MapPin size={19} />
                </div>

                <div>
                  <span>Consegna</span>
                  <h2>Dati di spedizione</h2>
                </div>
              </div>

              <div className="form-grid two">
                <label>
                  <span>Nome *</span>
                  <input
                    className="input-ery"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    autoComplete="given-name"
                    required
                  />
                </label>

                <label>
                  <span>Cognome *</span>
                  <input
                    className="input-ery"
                    type="text"
                    name="surname"
                    value={form.surname}
                    onChange={updateField}
                    autoComplete="family-name"
                    required
                  />
                </label>
              </div>

              <div className="form-grid two">
                <label>
                  <span>Email *</span>
                  <input
                    className="input-ery"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    autoComplete="email"
                    required
                  />
                </label>

                <label>
                  <span>Telefono *</span>
                  <input
                    className="input-ery"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    autoComplete="tel"
                    required
                  />
                </label>
              </div>

              <label>
                <span>Indirizzo e numero civico *</span>
                <input
                  className="input-ery"
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  autoComplete="street-address"
                  placeholder="Via, piazza, numero civico"
                  required
                />
              </label>

              <div className="form-grid three">
                <label>
                  <span>Città *</span>
                  <input
                    className="input-ery"
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    autoComplete="address-level2"
                    required
                  />
                </label>

                <label>
                  <span>Provincia *</span>
                  <input
                    className="input-ery"
                    type="text"
                    name="province"
                    value={form.province}
                    onChange={updateField}
                    maxLength={2}
                    placeholder="OR"
                    required
                  />
                </label>

                <label>
                  <span>CAP *</span>
                  <input
                    className="input-ery"
                    type="text"
                    name="cap"
                    value={form.cap}
                    onChange={updateField}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    pattern="[0-9]{5}"
                    placeholder="09025"
                    required
                  />
                </label>
              </div>

              <label>
                <span>Note sull'ordine</span>
                <textarea
                  className="input-ery checkout-notes"
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  placeholder="Eventuali indicazioni per Erika..."
                />
              </label>
            </section>

            <section className="checkout-card">
              <div className="section-title">
                <div className="section-icon">
                  <CreditCard size={19} />
                </div>

                <div>
                  <span>Pagamento</span>
                  <h2>Pagamento sicuro</h2>
                </div>
              </div>

              <div className="stripe-placeholder">
                <LockKeyhole size={23} />

                <div>
                  <strong>Pagamento con Stripe</strong>

                  <p>
                    Dopo aver premuto il pulsante
                    verrai trasferito alla pagina
                    sicura di Stripe.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="order-summary">
            <span className="summary-kicker">
              Riepilogo
            </span>

            <h2>Il tuo ordine</h2>

            <div className="checkout-products">
              {cart.map((item) => (
                <div
                  className="checkout-product"
                  key={item.id}
                >
                  <div className="checkout-product-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <span>ERY</span>
                    )}

                    <b>{item.qty || 1}</b>
                  </div>

                  <div className="checkout-product-name">
                    <strong>{item.name}</strong>
                    <span>
                      Quantità: {item.qty || 1}
                    </span>
                  </div>

                  <strong className="checkout-product-price">
                    €{' '}
                    {(
                      Number(item.price || 0) *
                      Number(item.qty || 1)
                    ).toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="summary-divider" />

            <div className="summary-row">
              <span>Subtotale</span>
              <strong>
                € {subtotal.toFixed(2)}
              </strong>
            </div>

            <div className="summary-row">
              <span>Spedizione</span>

              {settingsLoading ? (
                <span>Calcolo...</span>
              ) : freeShipping ? (
                <strong className="free-shipping">
                  Gratuita
                </strong>
              ) : (
                <strong>
                  € {appliedShipping.toFixed(2)}
                </strong>
              )}
            </div>

            {freeShippingThreshold > 0 &&
              !freeShipping &&
              subtotal < freeShippingThreshold && (
                <div className="shipping-hint">
                  Ti mancano €{' '}
                  {(
                    freeShippingThreshold -
                    subtotal
                  ).toFixed(2)}{' '}
                  per ottenere la spedizione gratuita.
                </div>
              )}

            <div className="summary-divider" />

            <div className="coupon-section">
              <div className="coupon-title">
                <TicketPercent size={17} />
                <strong>Hai un codice sconto?</strong>
              </div>

              {appliedCoupon ? (
                <div className="coupon-applied">
                  <CheckCircle2 size={17} />

                  <div>
                    <strong>
                      {appliedCoupon.code}
                    </strong>

                    <span>
                      Sconto applicato: €{' '}
                      {couponDiscount.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Rimuovi coupon"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <div className="coupon-input-row">
                  <input
                    className="input-ery"
                    type="text"
                    placeholder="Codice coupon"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(
                        event.target.value.toUpperCase()
                      )
                      setCouponError('')
                    }}
                    disabled={couponLoading || loading}
                  />

                  <button
                    type="button"
                    className="btn-outline coupon-button"
                    onClick={applyCoupon}
                    disabled={couponLoading || loading}
                  >
                    {couponLoading
                      ? 'Verifica...'
                      : 'Applica'}
                  </button>
                </div>
              )}

              {couponError && (
                <div className="checkout-error">
                  {couponError}
                </div>
              )}
            </div>

            {couponDiscount > 0 && (
              <div className="summary-row discount-row">
                <span>
                  Sconto {appliedCoupon?.code}
                </span>

                <strong>
                  - € {couponDiscount.toFixed(2)}
                </strong>
              </div>
            )}

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Totale</span>

              <strong>
                € {total.toFixed(2)}
              </strong>
            </div>

            {error && (
              <div className="checkout-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary pay-button"
              disabled={
                loading ||
                settingsLoading ||
                couponLoading ||
                Boolean(error && settingsLoading)
              }
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="checkout-spinner"
                  />
                  Collegamento a Stripe...
                </>
              ) : (
                <>
                  <LockKeyhole size={16} />
                  Continua al pagamento
                </>
              )}
            </button>

            <p className="secure-text">
              <LockKeyhole size={12} />
              Il pagamento viene gestito
              direttamente da Stripe.
            </p>
          </aside>
        </form>
      </div>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .checkout-page {
    min-height: 75vh;
    padding: 42px 0 90px;
  }

  .checkout-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 28px;
    color: var(--terracotta);
    font-size: 13px;
    font-weight: 600;
  }

  .checkout-heading {
    margin-bottom: 35px;
  }

  .checkout-heading > span,
  .summary-kicker,
  .section-title span {
    color: var(--terracotta);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .checkout-heading h1 {
    margin: 5px 0;
    color: #443731;
    font-size: 55px;
    font-weight: 500;
  }

  .checkout-heading p {
    margin: 0;
    color: #83766f;
    font-size: 13px;
  }

  .checkout-layout {
    display: grid;
    grid-template-columns:
      minmax(0, 1.35fr)
      minmax(320px, .65fr);
    gap: 38px;
    align-items: start;
  }

  .checkout-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .checkout-card,
  .order-summary {
    padding: 27px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 23px;
    background: white;
    box-shadow:
      0 10px 35px rgba(73,54,45,.05);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 25px;
  }

  .section-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(224,169,155,.18);
    color: var(--terracotta);
  }

  .section-title h2 {
    margin: 2px 0 0;
    color: #443731;
    font-size: 27px;
    font-weight: 600;
  }

  .form-grid {
    display: grid;
    gap: 16px;
  }

  .form-grid.two {
    grid-template-columns: 1fr 1fr;
  }

  .form-grid.three {
    grid-template-columns: 1.5fr .7fr .7fr;
  }

  .checkout-card label {
    display: block;
    margin-bottom: 17px;
  }

  .checkout-card label > span {
    display: block;
    margin-bottom: 7px;
    color: #615650;
    font-size: 11px;
    font-weight: 600;
  }

  .checkout-notes {
    min-height: 100px;
    resize: vertical;
  }

  .stripe-placeholder {
    display: flex;
    gap: 13px;
    align-items: center;
    padding: 18px;
    border-radius: 15px;
    background: rgba(144,153,139,.09);
    color: #655b55;
  }

  .stripe-placeholder svg {
    flex: 0 0 auto;
    color: var(--sage);
  }

  .stripe-placeholder strong {
    font-size: 13px;
  }

  .stripe-placeholder p {
    margin: 4px 0 0;
    color: #8a7f79;
    font-size: 11px;
    line-height: 1.5;
  }

  .order-summary {
    position: sticky;
    top: 105px;
  }

  .order-summary h2 {
    margin: 5px 0 24px;
    color: #443731;
    font-size: 31px;
    font-weight: 500;
  }

  .checkout-products {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .checkout-product {
    display: grid;
    grid-template-columns: 55px 1fr auto;
    gap: 12px;
    align-items: center;
  }

  .checkout-product-image {
    position: relative;
    width: 55px;
    height: 55px;
    border-radius: 11px;
    background: #f3efeb;
  }

  .checkout-product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 11px;
  }

  .checkout-product-image > span {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--terracotta);
    font-family:
      'Cormorant Garamond',
      serif;
  }

  .checkout-product-image b {
    position: absolute;
    top: -7px;
    right: -7px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: var(--terracotta);
    color: white;
    font-size: 9px;
  }

  .checkout-product-name {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .checkout-product-name strong {
    overflow: hidden;
    color: #50443e;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .checkout-product-name span {
    color: #988c85;
    font-size: 9px;
  }

  .checkout-product-price {
    color: #51453f;
    font-size: 11px;
  }

  .summary-divider {
    height: 1px;
    margin: 22px 0;
    background: rgba(112,83,70,.12);
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin: 13px 0;
    color: #766b65;
    font-size: 12px;
  }

  .free-shipping {
    color: var(--sage);
  }

  .shipping-hint {
    margin-top: 8px;
    padding: 9px 11px;
    border-radius: 10px;
    background: rgba(144,153,139,.08);
    color: #81766f;
    font-size: 10px;
    line-height: 1.45;
  }

  .coupon-section {
    margin: 20px 0;
  }

  .coupon-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #615650;
    font-size: 12px;
  }

  .coupon-title svg {
    color: var(--terracotta);
  }

  .coupon-input-row {
    display: flex;
    gap: 8px;
  }

  .coupon-input-row input {
    min-width: 0;
    flex: 1;
    text-transform: uppercase;
  }

  .coupon-button {
    padding: 10px 14px;
    border-radius: 10px;
    cursor: pointer;
  }

  .coupon-button:disabled {
    opacity: .6;
    cursor: wait;
  }

  .coupon-applied {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid rgba(144,153,139,.25);
    border-radius: 12px;
    background: rgba(144,153,139,.09);
    color: var(--sage);
  }

  .coupon-applied > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .coupon-applied strong {
    color: #51453f;
    font-size: 12px;
  }

  .coupon-applied span {
    color: #766b65;
    font-size: 11px;
  }

  .coupon-applied button {
    border: 0;
    background: transparent;
    color: #766b65;
    cursor: pointer;
  }

  .discount-row strong {
    color: var(--sage);
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
    font-family:
      'Cormorant Garamond',
      serif;
    font-size: 28px;
  }

  .checkout-error {
    margin-top: 15px;
    padding: 12px 14px;
    border: 1px solid rgba(175,65,65,.2);
    border-radius: 12px;
    background: rgba(175,65,65,.07);
    color: #9d3e3e;
    font-size: 11px;
    line-height: 1.5;
  }

  .pay-button {
    width: 100%;
    margin-top: 24px;
    border: 0;
  }

  .pay-button:disabled {
    opacity: .65;
    cursor: wait;
  }

  .checkout-spinner {
    animation: checkout-spin 1s linear infinite;
  }

  @keyframes checkout-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .secure-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    margin: 13px 0 0;
    color: #9a8f88;
    font-size: 9px;
  }

  .checkout-empty {
    min-height: 72vh;
    display: flex;
    align-items: center;
  }

  .checkout-empty-box {
    text-align: center;
  }

  .checkout-empty-box > svg {
    color: var(--terracotta);
  }

  .checkout-empty-box h1 {
    margin: 15px 0 8px;
    color: #443731;
    font-size: 45px;
  }

  .checkout-empty-box p {
    margin: 0 0 25px;
    color: #83766f;
  }

  @media (max-width: 850px) {
    .checkout-layout {
      grid-template-columns: 1fr;
    }

    .order-summary {
      position: static;
    }
  }

  @media (max-width: 600px) {
    .checkout-heading h1 {
      font-size: 44px;
    }

    .form-grid.two,
    .form-grid.three {
      grid-template-columns: 1fr;
    }

    .checkout-card,
    .order-summary {
      padding: 20px;
    }

    .coupon-input-row {
      flex-wrap: wrap;
    }

    .coupon-button {
      width: 100%;
    }
  }
`

export default Checkout