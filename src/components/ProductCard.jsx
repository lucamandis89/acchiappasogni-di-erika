import { useEffect, useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] =
    useState(false)

  const price = Number(product.price || 0)

  const salePrice =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    Number(product.sale_price) > 0
      ? Number(product.sale_price)
      : null

  const finalPrice = salePrice || price
  const madeToOrder = Boolean(product.made_to_order)
  const soldOut = Number(product.stock || 0) <= 0 && !madeToOrder

  const image =
    product.cover_image ||
    (Array.isArray(product.images) &&
    product.images.length > 0
      ? product.images[0]
      : '')

  useEffect(() => {
    let active = true

    async function loadFavorite() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!active) return

        setUser(currentUser || null)

        if (!currentUser || !product?.id) {
          setIsFavorite(false)
          return
        }

        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('product_id', product.id)
          .maybeSingle()

        if (!active) return

        if (error) {
          console.error(
            'Errore caricamento preferito:',
            error
          )
          return
        }

        setIsFavorite(Boolean(data))
      } catch (error) {
        console.error(
          'Errore caricamento preferito:',
          error
        )
      }
    }

    loadFavorite()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return

        const currentUser =
          session?.user || null

        setUser(currentUser)

        if (!currentUser) {
          setIsFavorite(false)
        } else {
          loadFavorite()
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [product?.id])

  function addToCart(e) {
    e.preventDefault()
    e.stopPropagation()

    if (soldOut) return

    if (onAddToCart) {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: finalPrice,
        image,
        maxStock: madeToOrder ? null : product.stock,
        madeToOrder,
        qty: 1,
      })
    }
  }

  async function toggleFavorite(e) {
    e.preventDefault()
    e.stopPropagation()

    if (favoriteLoading) return

    if (!user) {
      navigate('/login', {
        state: {
          message:
            'Accedi per salvare i tuoi prodotti preferiti.',
        },
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

        if (error) {
          throw error
        }

        setIsFavorite(false)
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: product.id,
          })

        if (error) {
          throw error
        }

        setIsFavorite(true)
      }
    } catch (error) {
      console.error(
        'Errore modifica preferito:',
        error
      )

      alert(
        'Non è stato possibile aggiornare i preferiti. Riprova.'
      )
    } finally {
      setFavoriteLoading(false)
    }
  }

  return (
    <article className="product-card">
      <Link
        to={`/prodotto/${product.id}`}
        className="product-image-wrap"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="product-no-image">
            Nessuna immagine
          </div>
        )}

        <div className="product-badges">
          {product.is_new && (
            <span className="product-badge badge-new">
              Novità
            </span>
          )}

          {product.unique_piece && (
            <span className="product-badge badge-unique">
              Pezzo unico
            </span>
          )}

          {madeToOrder && (
            <span className="product-badge badge-order">
              Su ordinazione
            </span>
          )}

          {salePrice && (
            <span className="product-badge badge-sale">
              Offerta
            </span>
          )}
        </div>

        {soldOut && (
          <div className="sold-out-overlay">
            <span>Esaurito</span>
          </div>
        )}
      </Link>

      <div className="product-card-body">
        <div className="product-card-top">
          <div>
            {product.category_name && (
              <div className="product-category">
                {product.category_name}
              </div>
            )}

            <Link
              to={`/prodotto/${product.id}`}
            >
              <h3 className="product-title">
                {product.name}
              </h3>
            </Link>
          </div>

          <button
            className={`favorite-button ${
              isFavorite
                ? 'favorite-button-active'
                : ''
            }`}
            type="button"
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            aria-label={
              isFavorite
                ? 'Rimuovi dai preferiti'
                : 'Aggiungi ai preferiti'
            }
            title={
              isFavorite
                ? 'Rimuovi dai preferiti'
                : 'Aggiungi ai preferiti'
            }
          >
            <Heart
              size={19}
              fill={
                isFavorite
                  ? 'currentColor'
                  : 'none'
              }
            />
          </button>
        </div>

        {product.short_description && (
          <p className="product-description">
            {product.short_description}
          </p>
        )}

        <div className="product-bottom">
          <div className="product-price">
            {salePrice ? (
              <>
                <span className="old-price">
                  € {price.toFixed(2)}
                </span>

                <strong>
                  € {salePrice.toFixed(2)}
                </strong>
              </>
            ) : (
              <strong>
                € {price.toFixed(2)}
              </strong>
            )}
          </div>

          <button
            type="button"
            className="quick-cart"
            onClick={addToCart}
            disabled={soldOut}
            aria-label={
              soldOut
                ? 'Prodotto esaurito'
                : `Aggiungi ${product.name} al carrello`
            }
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .product-card {
          background: white;
          border: 1px solid rgba(112,83,70,.11);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(73,54,45,.06);
          transition:
            transform .25s ease,
            box-shadow .25s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 14px 35px rgba(73,54,45,.11);
        }

        .product-image-wrap {
          position: relative;
          display: block;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: #f4eee8;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .45s ease;
        }

        .product-card:hover .product-image {
          transform: scale(1.035);
        }

        .product-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sage);
          font-size: 13px;
        }

        .product-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }

        .product-badge {
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .4px;
          box-shadow:
            0 2px 8px rgba(0,0,0,.08);
        }

        .badge-new {
          background: var(--sage);
          color: white;
        }

        .badge-unique {
          background: var(--gold);
          color: #fff;
        }

        .badge-sale {
          background: var(--terracotta);
          color: white;
        }

        .badge-order {
          background: #6f7d68;
          color: white;
        }

        .sold-out-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,.56);
          backdrop-filter: grayscale(1);
        }

        .sold-out-overlay span {
          padding: 8px 15px;
          border-radius: 999px;
          background: rgba(63,55,50,.88);
          color: white;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .product-card-body {
          padding: 17px;
        }

        .product-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .product-category {
          margin-bottom: 5px;
          color: var(--sage);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
        }

        .product-title {
          margin: 0;
          color: #443731;
          font-size: 21px;
          line-height: 1.05;
          font-weight: 600;
        }

        .favorite-button {
          flex: 0 0 auto;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--terracotta);
          cursor: pointer;
          transition:
            background .2s ease,
            transform .2s ease,
            opacity .2s ease;
        }

        .favorite-button:hover:not(:disabled) {
          background: rgba(139,72,54,.08);
          transform: scale(1.08);
        }

        .favorite-button-active {
          background: rgba(139,72,54,.1);
          color: var(--terracotta);
        }

        .favorite-button:disabled {
          opacity: .55;
          cursor: wait;
        }

        .product-description {
          min-height: 36px;
          margin: 10px 0 15px;
          color: #776b65;
          font-size: 12px;
          line-height: 1.5;
        }

        .product-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .product-price {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 7px;
          color: var(--terracotta);
        }

        .product-price strong {
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 22px;
        }

        .old-price {
          color: #a49b96;
          font-size: 12px;
          text-decoration: line-through;
        }

        .quick-cart {
          width: 39px;
          height: 39px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: var(--terracotta);
          color: white;
          cursor: pointer;
          transition:
            transform .2s ease,
            opacity .2s ease;
        }

        .quick-cart:hover:not(:disabled) {
          transform: scale(1.06);
        }

        .quick-cart:disabled {
          background: #c7c0bc;
          cursor: not-allowed;
          opacity: .7;
        }

        @media (max-width: 600px) {
          .product-card-body {
            padding: 13px;
          }

          .product-title {
            font-size: 18px;
          }

          .product-description {
            min-height: 0;
          }
        }
      `}</style>
    </article>
  )
}

export default ProductCard