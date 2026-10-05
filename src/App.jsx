import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'
import AdminRoute from './components/AdminRoute'

import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import Reviews from './pages/Reviews'
import About from './pages/About'
import Personalizzati from './pages/Personalizzati'
import Configurator from './pages/Configurator'
import Privacy from './pages/Privacy'
import Cookie from './pages/Cookie'
import Terms from './pages/Terms'

import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Favorites from './pages/Favorites'

import Admin from './pages/Admin'
import AdminProducts from './pages/AdminProducts'
import AdminOrders from './pages/AdminOrders'
import AdminCategories from './pages/AdminCategories'
import AdminCoupons from './pages/AdminCoupons'
import AdminReviews from './pages/AdminReviews'
import AdminMessages from './pages/AdminMessages'
import AdminFAQ from './pages/AdminFAQ'
import AdminShipping from './pages/AdminShipping'
import AdminProjects from './pages/AdminProjects'
import AdminConfigurator from './pages/AdminConfigurator'

const CART_KEY = 'ery_cart'

function PlaceholderPage({ title }) {
  return (
    <main
      className="container-ery"
      style={{
        minHeight: '65vh',
        paddingTop: '80px',
        paddingBottom: '80px',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '48px',
          fontWeight: 500,
          color: '#443731',
          marginBottom: '15px',
        }}
      >
        {title}
      </h1>

      <p
        style={{
          color: '#83766f',
          fontSize: '14px',
        }}
      >
        Questa sezione è in preparazione.
      </p>

      <a
        href="/"
        className="btn-primary"
        style={{
          display: 'inline-flex',
          marginTop: '20px',
        }}
      >
        Torna alla Home
      </a>
    </main>
  )
}

function App() {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart =
        localStorage.getItem(CART_KEY)

      if (!savedCart) {
        return []
      }

      const parsed = JSON.parse(savedCart)

      return Array.isArray(parsed)
        ? parsed
        : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart)
    )
  }, [cart])

  function addToCart(product, quantity = 1) {
    if (!product?.id) {
      return
    }

    const requestedQty = Math.max(
      1,
      Number(quantity || 1)
    )

    const rawMaxStock =
      Number(product.maxStock)

    const maxStock =
      Number.isFinite(rawMaxStock) &&
      rawMaxStock > 0
        ? rawMaxStock
        : 999

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      )

      if (existing) {
        return currentCart.map((item) => {
          if (item.id !== product.id) {
            return item
          }

          return {
            ...item,
            qty: Math.min(
              Number(item.qty || 1) +
                requestedQty,
              maxStock
            ),
            maxStock,
          }
        })
      }

      return [
        ...currentCart,
        {
          ...product,
          qty: Math.min(
            requestedQty,
            maxStock
          ),
          maxStock,
        },
      ]
    })
  }

  function setCartQty(
    productId,
    quantity
  ) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== productId) {
          return item
        }

        const rawMaxStock = Number(
          item.maxStock
        )

        const maxStock =
          Number.isFinite(rawMaxStock) &&
          rawMaxStock > 0
            ? rawMaxStock
            : 999

        const nextQty = Math.max(
          1,
          Math.min(
            Number(quantity || 1),
            maxStock
          )
        )

        return {
          ...item,
          qty: nextQty,
        }
      })
    )
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    )
  }

  function clearCart() {
    setCart([])
    localStorage.removeItem(CART_KEY)
  }

  const cartCount = cart.reduce(
    (total, item) =>
      total + Number(item.qty || 1),
    0
  )

  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header cartCount={cartCount} />

        <div style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  onAddToCart={addToCart}
                />
              }
            />

            <Route
              path="/shop"
              element={
                <Shop
                  onAddToCart={addToCart}
                />
              }
            />

            <Route
              path="/prodotto/:id"
              element={
                <ProductDetail
                  onAddToCart={addToCart}
                />
              }
            />

            <Route
              path="/carrello"
              element={
                <Cart
                  cart={cart}
                  onSetQty={setCartQty}
                  onRemove={removeFromCart}
                />
              }
            />

            <Route
              path="/checkout"
              element={
                <Checkout cart={cart} />
              }
            />

            <Route
              path="/ordine-confermato"
              element={
                <OrderSuccess
                  onPaymentSuccess={
                    clearCart
                  }
                />
              }
            />

            <Route
              path="/configuratore"
              element={<Configurator />}
            />

            <Route
              path="/personalizzati"
              element={<Personalizzati />}
            />

            <Route
              path="/chi-siamo"
              element={<About />}
            />

            <Route
              path="/faq"
              element={<FAQ />}
            />

            <Route
              path="/contatti"
              element={<Contact />}
            />

            <Route
              path="/recensioni"
              element={<Reviews />}
            />

            <Route
              path="/privacy"
              element={<Privacy />}
            />

            <Route
              path="/cookie"
              element={<Cookie />}
            />

            <Route
              path="/termini"
              element={<Terms />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/registrati"
              element={<Register />}
            />

            <Route
              path="/account"
              element={<Account />}
            />

            <Route
              path="/password-dimenticata"
              element={<ForgotPassword />}
            />

            <Route
              path="/reimposta-password"
              element={<ResetPassword />}
            />

            <Route
              path="/preferiti"
              element={
                <Favorites
                  onAddToCart={addToCart}
                />
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/prodotti"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/ordini"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/categorie"
              element={
                <AdminRoute>
                  <AdminCategories />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/coupon"
              element={
                <AdminRoute>
                  <AdminCoupons />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/recensioni"
              element={
                <AdminRoute>
                  <AdminReviews />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/messaggi"
              element={
                <AdminRoute>
                  <AdminMessages />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/faq"
              element={
                <AdminRoute>
                  <AdminFAQ />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/spedizioni"
              element={
                <AdminRoute>
                  <AdminShipping />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/progetti"
              element={
                <AdminRoute>
                  <AdminProjects />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/configuratore"
              element={
                <AdminRoute>
                  <AdminConfigurator />
                </AdminRoute>
              }
            />

            <Route
              path="*"
              element={
                <PlaceholderPage
                  title="Pagina non trovata"
                />
              }
            />
          </Routes>
        </div>

        <Footer />
        <WhatsAppFloat />
      </div>
    </BrowserRouter>
  )
}

export default App