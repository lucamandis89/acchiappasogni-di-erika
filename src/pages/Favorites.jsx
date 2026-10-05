import { useEffect, useState } from 'react'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Favorites({ onAddToCart }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    let active = true

    async function loadFavorites() {
      setLoading(true)

      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!active) return

        if (!currentUser) {
          navigate('/login', {
            replace: true,
            state: {
              message:
                'Accedi per vedere i tuoi prodotti preferiti.',
            },
          })
          return
        }

        setUser(currentUser)

        const { data: favoriteRows, error: favoriteError } =
          await supabase
            .from('favorites')
            .select('id, product_id, created_at')
            .eq('user_id', currentUser.id)
            .order('created_at', {
              ascending: false,
            })

        if (favoriteError) {
          throw favoriteError
        }

        if (
          !favoriteRows ||
          favoriteRows.length === 0
        ) {
          if (active) {
            setFavorites([])
            setLoading(false)
          }
          return
        }

        const productIds = favoriteRows.map(
          (item) => item.product_id
        )

        const { data: products, error: productError } =
          await supabase
            .from('products')
            .select('*')
            .in('id', productIds)
            .eq('active', true)

        if (productError) {
          throw productError
        }

        const productMap = new Map(
          (products || []).map((product) => [
            product.id,
            product,
          ])
        )

        const combined = favoriteRows
          .map((favorite) => {
            const product = productMap.get(
              favorite.product_id
            )

            if (!product) return null

            return {
              favoriteId: favorite.id,
              ...product,
            }
          })
          .filter(Boolean)

        if (active) {
          setFavorites(combined)
        }
      } catch (error) {
        console.error(
          'Errore caricamento preferiti:',
          error
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadFavorites()

    return () => {
      active = false
    }
  }, [navigate])

  async function removeFavorite(productId) {
    if (!user || removingId) return

    try {
      setRemovingId(productId)

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) {
        throw error
      }

      setFavorites((current) =>
        current.filter(
          (product) => product.id !== productId
        )
      )
    } catch (error) {
      console.error(
        'Errore rimozione preferito:',
        error
      )

      alert(
        'Non è stato possibile rimuovere il prodotto dai preferiti.'
      )
    } finally {
      setRemovingId(null)
    }
  }

  function addProductToCart(product) {
    if (!onAddToCart) return

    const stock = Number(product.stock || 0)

    if (stock <= 0) return

    const normalPrice = Number(
      product.price || 0
    )

    const salePrice =
      product.sale_price !== null &&
      product.sale_price !== undefined &&
      Number(product.sale_price) > 0
        ? Number(product.sale_price)
        : null

    const image =
      product.cover_image ||
      (Array.isArray(product.images) &&
      product.images.length > 0
        ? product.images[0]
        : '')

    onAddToCart({
      id: product.id,
      name: product.name,
      price: salePrice || normalPrice,
      image,
      maxStock: stock,
      qty: 1,
    })
  }

  if (loading) {
    return (
      <main className="favorites-loading">
        <div className="favorites-spinner" />
        <p>Caricamento preferiti...</p>

        <style>{`
          .favorites-loading {
            min-height: 65vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            color: #83766f;
          }

          .favorites-spinner {
            width: 34px;
            height: 34px;
            border: 3px solid #eadfda;
            border-top-color: #9b6656;
            border-radius: 50%;
            animation: favorites-spin .8s linear infinite;
          }

          @keyframes favorites-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    )
  }

  return (
    <main className="favorites-page">
      <div className="favorites-container">
        <header className="favorites-header">
          <div className="favorites-heart">
            <Heart
              size={27}
              fill="currentColor"
            />
          </div>

          <span>I tuoi preferiti</span>

          <h1>Creazioni nel cuore</h1>

          <p>
            Qui trovi gli acchiappasogni che hai
            salvato durante la tua visita.
          </p>
        </header>

        {favorites.length === 0 ? (
          <section className="favorites-empty">
            <Heart size={42} />

            <h2>Non hai ancora preferiti</h2>

            <p>
              Esplora lo Shop e premi il cuore sulle
              creazioni che vuoi conservare qui.
            </p>

            <Link
              to="/shop"
              className="favorites-shop-button"
            >
              <ShoppingBag size={18} />
              Scopri lo Shop
            </Link>
          </section>
        ) : (
          <>
            <div className="favorites-count">
              {favorites.length === 1
                ? '1 creazione salvata'
                : `${favorites.length} creazioni salvate`}
            </div>

            <section className="favorites-grid">
              {favorites.map((product) => {
                const price = Number(
                  product.price || 0
                )

                const salePrice =
                  product.sale_price !== null &&
                  product.sale_price !== undefined &&
                  Number(product.sale_price) > 0
                    ? Number(product.sale_price)
                    : null

                const stock = Number(
                  product.stock || 0
                )

                const soldOut = stock <= 0

                const image =
                  product.cover_image ||
                  (Array.isArray(product.images) &&
                  product.images.length > 0
                    ? product.images[0]
                    : '')

                return (
                  <article
                    key={product.id}
                    className="favorite-card"
                  >
                    <Link
                      to={`/prodotto/${product.id}`}
                      className="favorite-image-wrap"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="favorite-no-image">
                          Nessuna immagine
                        </div>
                      )}

                      {soldOut && (
                        <span className="favorite-sold-out">
                          Esaurito
                        </span>
                      )}
                    </Link>

                    <div className="favorite-body">
                      {product.category_name && (
                        <span className="favorite-category">
                          {product.category_name}
                        </span>
                      )}

                      <Link
                        to={`/prodotto/${product.id}`}
                        className="favorite-title-link"
                      >
                        <h2>
                          {product.name}
                        </h2>
                      </Link>

                      {product.short_description && (
                        <p className="favorite-description">
                          {product.short_description}
                        </p>
                      )}

                      <div className="favorite-price">
                        {salePrice ? (
                          <>
                            <span>
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

                      <div className="favorite-actions">
                        <button
                          type="button"
                          className="favorite-cart-button"
                          disabled={soldOut}
                          onClick={() =>
                            addProductToCart(product)
                          }
                        >
                          <ShoppingBag size={17} />

                          {soldOut
                            ? 'Esaurito'
                            : 'Aggiungi al carrello'}
                        </button>

                        <button
                          type="button"
                          className="favorite-remove-button"
                          disabled={
                            removingId === product.id
                          }
                          onClick={() =>
                            removeFavorite(product.id)
                          }
                          aria-label="Rimuovi dai preferiti"
                          title="Rimuovi dai preferiti"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>
          </>
        )}
      </div>

      <style>{`
        .favorites-page {
          min-height: 70vh;
          padding: 65px 20px 90px;
          background: #fcfaf7;
        }

        .favorites-container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .favorites-header {
          max-width: 650px;
          margin: 0 auto 42px;
          text-align: center;
        }

        .favorites-heart {
          width: 58px;
          height: 58px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f6e8e3;
          color: #9b6656;
        }

        .favorites-header > span {
          color: #9b6656;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .14em;
        }

        .favorites-header h1 {
          margin: 6px 0 8px;
          color: #443731;
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 46px;
          font-weight: 500;
        }

        .favorites-header p {
          margin: 0;
          color: #83766f;
          font-size: 14px;
          line-height: 1.7;
        }

        .favorites-count {
          margin-bottom: 18px;
          color: #83766f;
          font-size: 13px;
        }

        .favorites-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .favorite-card {
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(68,55,49,.09);
          border-radius: 21px;
          box-shadow:
            0 10px 32px rgba(68,55,49,.055);
        }

        .favorite-image-wrap {
          position: relative;
          display: block;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: #f4eee8;
        }

        .favorite-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .35s ease;
        }

        .favorite-card:hover
        .favorite-image-wrap img {
          transform: scale(1.035);
        }

        .favorite-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #83766f;
          font-size: 13px;
        }

        .favorite-sold-out {
          position: absolute;
          top: 13px;
          right: 13px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(68,55,49,.88);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .favorite-body {
          padding: 19px;
        }

        .favorite-category {
          display: block;
          margin-bottom: 5px;
          color: #8b9884;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .favorite-title-link {
          text-decoration: none;
        }

        .favorite-body h2 {
          margin: 0;
          color: #443731;
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 25px;
          line-height: 1.05;
          font-weight: 600;
        }

        .favorite-description {
          min-height: 40px;
          margin: 10px 0 14px;
          color: #83766f;
          font-size: 12px;
          line-height: 1.6;
        }

        .favorite-price {
          min-height: 29px;
          display: flex;
          align-items: baseline;
          gap: 8px;
          color: #9b6656;
        }

        .favorite-price strong {
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 23px;
        }

        .favorite-price > span {
          color: #a49b96;
          font-size: 12px;
          text-decoration: line-through;
        }

        .favorite-actions {
          display: flex;
          gap: 9px;
          margin-top: 17px;
        }

        .favorite-cart-button {
          flex: 1;
          min-height: 43px;
          border: 0;
          border-radius: 11px;
          background: #9b6656;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .favorite-cart-button:disabled {
          background: #c7c0bc;
          cursor: not-allowed;
        }

        .favorite-remove-button {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          border: 1px solid #e5d9d4;
          border-radius: 11px;
          background: #fff;
          color: #9b6656;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .favorite-remove-button:hover:not(:disabled) {
          background: #f8eeea;
        }

        .favorite-remove-button:disabled {
          opacity: .5;
          cursor: wait;
        }

        .favorites-empty {
          max-width: 550px;
          margin: 0 auto;
          padding: 55px 25px;
          text-align: center;
          background: #fff;
          border: 1px solid rgba(68,55,49,.09);
          border-radius: 22px;
        }

        .favorites-empty > svg {
          color: #d2aaa0;
          margin-bottom: 12px;
        }

        .favorites-empty h2 {
          margin: 0 0 8px;
          color: #443731;
          font-family:
            'Cormorant Garamond',
            serif;
          font-size: 30px;
        }

        .favorites-empty p {
          max-width: 390px;
          margin: 0 auto;
          color: #83766f;
          font-size: 13px;
          line-height: 1.7;
        }

        .favorites-shop-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 45px;
          margin-top: 22px;
          padding: 0 20px;
          border-radius: 11px;
          background: #9b6656;
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .favorites-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .favorites-page {
            padding: 42px 15px 70px;
          }

          .favorites-header {
            margin-bottom: 30px;
          }

          .favorites-header h1 {
            font-size: 38px;
          }

          .favorites-grid {
            grid-template-columns: 1fr;
          }

          .favorite-description {
            min-height: 0;
          }
        }
      `}</style>
    </main>
  )
}

export default Favorites