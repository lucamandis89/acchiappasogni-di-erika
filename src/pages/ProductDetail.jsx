import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  MessageCircle,
  Check,
  Package,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

function ProductDetail({ onAddToCart }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [user, setUser] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single()

      if (error) {
        console.error(error)
        setError(error.message)
        setProduct(null)
      } else {
        setProduct(data)

        const firstImage =
          data.cover_image ||
          (Array.isArray(data.images) ? data.images[0] : '')

        setSelectedImage(firstImage || '')
      }

      setLoading(false)
    }

    loadProduct()
  }, [id])

  useEffect(() => {
    let active = true

    async function loadFavorite() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!active) return

      setUser(currentUser || null)

      if (!currentUser || !id) {
        setIsFavorite(false)
        return
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('product_id', id)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error('Errore caricamento preferito:', error)
        return
      }

      setIsFavorite(Boolean(data))
    }

    loadFavorite()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user || null)
      if (!session?.user) setIsFavorite(false)
      else loadFavorite()
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [id])

  const images = useMemo(() => {
    if (!product) return []

    const list = []

    if (product.cover_image) {
      list.push(product.cover_image)
    }

    if (Array.isArray(product.images)) {
      product.images.forEach((image) => {
        if (image && !list.includes(image)) {
          list.push(image)
        }
      })
    }

    return list
  }, [product])

  if (loading) {
    return (
      <main className="product-state">
        <div className="container-ery">
          Caricamento prodotto...
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="product-state">
        <div className="container-ery">
          <h1>Prodotto non trovato</h1>
          <p>La creazione che stai cercando non è disponibile.</p>

          <Link to="/shop" className="btn-primary">
            Torna allo Shop
          </Link>
        </div>
      </main>
    )
  }

  const normalPrice = Number(product.price || 0)
  const salePrice = Number(product.sale_price || 0)

  const hasSale =
    salePrice > 0 &&
    salePrice < normalPrice

  const finalPrice = hasSale
    ? salePrice
    : normalPrice

  const stock = parseInt(product.stock, 10) || 0
  const madeToOrder = Boolean(product.made_to_order)
  const soldOut = stock <= 0 && !madeToOrder

  function decreaseQty() {
    setQty((current) => Math.max(1, current - 1))
  }

  function increaseQty() {
    setQty((current) => {
      if (madeToOrder) return current
      if (stock <= 0) return current
      if (current >= stock) return current
      return current + 1
    })
  }

  function addToCart() {
    if (soldOut) return

    onAddToCart(
      {
        id: product.id,
        name: product.name,
        price: finalPrice,
        image: selectedImage || images[0] || '',
        maxStock: madeToOrder ? null : stock,
        madeToOrder,
      },
      qty
    )

    setAdded(true)

    window.setTimeout(() => {
      setAdded(false)
    }, 1800)
  }

  function buyNow() {
    if (soldOut) return

    addToCart()
    navigate('/carrello')
  }

  async function toggleFavorite() {
    if (favoriteLoading) return

    if (!user) {
      navigate('/login', {
        state: { message: 'Accedi per salvare i tuoi prodotti preferiti.' },
      })
      return
    }

    try {
      setFavoriteLoading(true)

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id)
        if (error) throw error
        setIsFavorite(false)
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: product.id })
        if (error) throw error
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Errore modifica preferito:', error)
      alert('Non è stato possibile aggiornare i preferiti. Riprova.')
    } finally {
      setFavoriteLoading(false)
    }
  }

  return (
    <main>
      <section className="product-page">
        <div className="container-ery">
          <Link to="/shop" className="back-shop">
            <ArrowLeft size={16} />
            Torna allo Shop
          </Link>

          <div className="product-detail-grid">
            <div className="product-gallery">
              <div className="main-product-image">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                  />
                ) : (
                  <div className="image-placeholder">
                    Nessuna immagine
                  </div>
                )}

                <div className="detail-badges">
                  {product.is_new && <span>Novità</span>}
                  {product.unique_piece && <span>Pezzo unico</span>}
                  {madeToOrder && <span>Su ordinazione</span>}
                  {hasSale && <span>Offerta</span>}
                </div>
              </div>

              {images.length > 1 && (
                <div className="product-thumbnails">
                  {images.map((image) => (
                    <button
                      type="button"
                      key={image}
                      className={
                        selectedImage === image
                          ? 'thumbnail active'
                          : 'thumbnail'
                      }
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={product.name}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-info">
              {product.category_name && (
                <div className="product-category">
                  {product.category_name}
                </div>
              )}

              <h1>{product.name}</h1>

              {product.sku && (
                <div className="product-sku">
                  Codice: {product.sku}
                </div>
              )}

              <div className="product-price-detail">
                {hasSale && (
                  <span className="old-price">
                    € {normalPrice.toFixed(2)}
                  </span>
                )}

                <span className="current-price">
                  € {finalPrice.toFixed(2)}
                </span>
              </div>

              {product.short_description && (
                <p className="short-description">
                  {product.short_description}
                </p>
              )}

              <div
                className={
                  soldOut
                    ? 'stock-status sold-out'
                    : 'stock-status available'
                }
              >
                {madeToOrder ? (
                  <>
                    <Package size={17} />
                    Su ordinazione
                  </>
                ) : soldOut ? (
                  <>
                    <Package size={17} />
                    Prodotto esaurito
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    Disponibile
                    {stock === 1
                      ? ' · ultimo pezzo'
                      : ` · ${stock} pezzi`}
                  </>
                )}
              </div>

              {product.personalizable && (
                <div className="personalizable-box">
                  ✦ Questa creazione è personalizzabile.
                </div>
              )}

              {!soldOut && (
                <>
                  <div className="quantity-row">
                    <span>Quantità</span>

                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={decreaseQty}
                        disabled={qty <= 1}
                      >
                        <Minus size={16} />
                      </button>

                      <strong>{qty}</strong>

                      <button
                        type="button"
                        onClick={increaseQty}
                        disabled={madeToOrder || qty >= stock}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="product-actions">
                    <button
                      type="button"
                      className="btn-primary add-cart-detail"
                      onClick={addToCart}
                    >
                      {added ? (
                        <>
                          <Check size={18} />
                          Aggiunto!
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} />
                          Aggiungi al carrello
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className={`favorite-detail ${isFavorite ? 'active' : ''}`}
                      aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                      title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                      onClick={toggleFavorite}
                      disabled={favoriteLoading}
                    >
                      <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="buy-now"
                    onClick={buyNow}
                  >
                    Acquista ora
                  </button>
                </>
              )}

              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                className="whatsapp-product"
              >
                <MessageCircle size={18} />
                Chiedi informazioni su WhatsApp
              </a>

              <div className="product-small-info">
                <div>
                  <strong>♡</strong>
                  Realizzato a mano
                </div>

                {product.unique_piece && (
                  <div>
                    <strong>✦</strong>
                    Pezzo unico
                  </div>
                )}

                {product.personalizable && (
                  <div>
                    <strong>✎</strong>
                    Personalizzabile
                  </div>
                )}
              </div>
            </div>
          </div>

          <section className="product-description-section">
            <span className="detail-kicker">
              Dettagli della creazione
            </span>

            <h2>Descrizione</h2>

            <p>
              {product.description ||
                product.short_description ||
                'Una creazione artigianale realizzata a mano da Erika.'}
            </p>

            <div className="product-details-list">
              {product.materials && (
                <div>
                  <strong>Materiali</strong>
                  <span>
                    {Array.isArray(product.materials)
                      ? product.materials.join(', ')
                      : product.materials}
                  </span>
                </div>
              )}

              {product.colors && (
                <div>
                  <strong>Colori</strong>
                  <span>
                    {Array.isArray(product.colors)
                      ? product.colors.join(', ')
                      : product.colors}
                  </span>
                </div>
              )}

              {product.dimensions && (
                <div>
                  <strong>Dimensioni</strong>
                  <span>{product.dimensions}</span>
                </div>
              )}

              {product.weight && (
                <div>
                  <strong>Peso</strong>
                  <span>{product.weight}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      <style>{`
        .product-state {
          min-height: 65vh;
          padding: 90px 0;
          text-align: center;
        }

        .product-state h1 {
          font-size: 45px;
          color: var(--terracotta);
        }

        .product-state p {
          margin-bottom: 25px;
          color: #776b65;
        }

        .product-page {
          padding: 42px 0 90px;
        }

        .back-shop {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 30px;
          color: var(--terracotta);
          font-size: 13px;
          font-weight: 600;
        }

        .product-detail-grid {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 65px;
          align-items: start;
        }

        .main-product-image {
          position: relative;
          overflow: hidden;
          aspect-ratio: 1 / 1;
          border-radius: 28px;
          background: #f3efeb;
        }

        .main-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #958983;
        }

        .detail-badges {
          position: absolute;
          top: 17px;
          left: 17px;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .detail-badges span {
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          color: var(--terracotta);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
        }

        .product-thumbnails {
          display: flex;
          gap: 10px;
          margin-top: 13px;
          overflow-x: auto;
        }

        .thumbnail {
          flex: 0 0 75px;
          width: 75px;
          height: 75px;
          overflow: hidden;
          padding: 0;
          border: 2px solid transparent;
          border-radius: 12px;
          background: white;
        }

        .thumbnail.active {
          border-color: var(--terracotta);
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-info {
          padding-top: 15px;
        }

        .product-category,
        .detail-kicker {
          color: var(--terracotta);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .product-info h1 {
          margin: 10px 0 6px;
          color: #443731;
          font-size: clamp(43px, 5vw, 64px);
          font-weight: 500;
          line-height: .98;
        }

        .product-sku {
          margin-bottom: 22px;
          color: #a0958f;
          font-size: 11px;
        }

        .product-price-detail {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 25px;
        }

        .old-price {
          color: #a89e99;
          font-size: 16px;
          text-decoration: line-through;
        }

        .current-price {
          color: var(--terracotta);
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 700;
        }

        .short-description {
          color: #716660;
          font-size: 14px;
          line-height: 1.8;
        }

        .stock-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 12px 0 20px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .stock-status.available {
          background: rgba(139,151,136,.15);
          color: #63705f;
        }

        .stock-status.sold-out {
          background: rgba(160,90,75,.11);
          color: #9b493c;
        }

        .personalizable-box {
          margin-bottom: 22px;
          padding: 14px 16px;
          border-radius: 13px;
          background: rgba(224,169,155,.17);
          color: var(--terracotta);
          font-size: 13px;
          font-weight: 600;
        }

        .quantity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0;
          border-top: 1px solid rgba(112,83,70,.12);
          font-size: 13px;
          font-weight: 600;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          overflow: hidden;
          border: 1px solid rgba(112,83,70,.2);
          border-radius: 999px;
          background: white;
        }

        .quantity-control button {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: var(--terracotta);
        }

        .quantity-control strong {
          min-width: 30px;
          text-align: center;
        }

        .product-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .add-cart-detail {
          flex: 1;
        }

        .favorite-detail {
          width: 49px;
          height: 49px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(112,83,70,.2);
          border-radius: 50%;
          background: white;
          color: var(--terracotta);
        }

        .favorite-detail.active {
          background: rgba(139,72,54,.10);
        }

        .favorite-detail:disabled {
          opacity: .55;
          cursor: wait;
        }

        .buy-now {
          width: 100%;
          margin-top: 10px;
          padding: 13px;
          border: 1px solid var(--terracotta);
          border-radius: 999px;
          background: transparent;
          color: var(--terracotta);
          font-weight: 700;
        }

        .buy-now:hover {
          background: var(--terracotta);
          color: white;
        }

        .whatsapp-product {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          padding: 13px;
          border-radius: 999px;
          background: rgba(139,151,136,.13);
          color: #5e6c5b;
          font-size: 13px;
          font-weight: 600;
        }

        .product-small-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid rgba(112,83,70,.12);
        }

        .product-small-info div {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #82756f;
          font-size: 10px;
        }

        .product-small-info strong {
          color: var(--terracotta);
        }

        .product-description-section {
          max-width: 850px;
          margin: 85px auto 0;
          padding-top: 55px;
          border-top: 1px solid rgba(112,83,70,.13);
          text-align: center;
        }

        .product-description-section h2 {
          margin: 8px 0 18px;
          color: #443731;
          font-size: 42px;
          font-weight: 500;
        }

        .product-description-section > p {
          color: #716660;
          font-size: 14px;
          line-height: 1.9;
          white-space: pre-line;
        }

        .product-details-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 35px;
          text-align: left;
        }

        .product-details-list div {
          padding: 17px;
          border-radius: 14px;
          background: white;
        }

        .product-details-list strong,
        .product-details-list span {
          display: block;
        }

        .product-details-list strong {
          margin-bottom: 5px;
          color: var(--terracotta);
          font-size: 11px;
          text-transform: uppercase;
        }

        .product-details-list span {
          color: #716660;
          font-size: 13px;
        }

        @media (max-width: 800px) {
          .product-detail-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .product-info {
            padding-top: 0;
          }
        }

        @media (max-width: 500px) {
          .product-page {
            padding-top: 25px;
          }

          .product-info h1 {
            font-size: 43px;
          }

          .product-small-info {
            grid-template-columns: 1fr;
          }

          .product-details-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}

export default ProductDetail