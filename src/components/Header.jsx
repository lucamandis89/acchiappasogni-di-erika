import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Menu,
  X,
  Search,
  User,
  Heart,
  ShoppingBag,
} from 'lucide-react'
import Logo from './Logo'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Crea il tuo acchiappasogni', to: '/configuratore' },
  { label: 'Personalizzati', to: '/personalizzati' },
  { label: 'Chi siamo', to: '/chi-siamo' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contatti', to: '/contatti' },
]

function Header({ cartCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')

  function submitSearch(e) {
    e.preventDefault()

    const value = search.trim()
    if (!value) return

    window.location.href = `/shop?q=${encodeURIComponent(value)}`
  }

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 253, 249, 0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(112,83,70,0.12)',
        }}
      >
        <div
          className="container-ery"
          style={{
            minHeight: '82px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>

          <nav className="desktop-nav">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link-active' : 'nav-link'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <button
              className="header-icon desktop-icon"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Cerca"
            >
              <Search size={20} />
            </button>

            <Link
              className="header-icon desktop-icon"
              to="/account"
              aria-label="Account"
            >
              <User size={20} />
            </Link>

            <Link
              className="header-icon desktop-icon"
              to="/preferiti"
              aria-label="Preferiti"
            >
              <Heart size={20} />
            </Link>

            <Link
              className="header-icon cart-icon"
              to="/carrello"
              aria-label="Carrello"
            >
              <ShoppingBag size={21} />

              {cartCount > 0 && (
                <span className="cart-badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            <button
              className="header-icon mobile-menu-button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="search-bar">
            <form
              className="container-ery"
              onSubmit={submitSearch}
              style={{
                display: 'flex',
                gap: '10px',
                paddingTop: '13px',
                paddingBottom: '13px',
              }}
            >
              <input
                className="input-ery"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca un acchiappasogni..."
                autoFocus
              />

              <button className="btn-primary" type="submit">
                Cerca
              </button>
            </form>
          </div>
        )}

        {menuOpen && (
          <div className="mobile-nav">
            <div className="container-ery">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    isActive
                      ? 'mobile-nav-link mobile-nav-link-active'
                      : 'mobile-nav-link'
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="mobile-nav-secondary">
                <Link to="/account" onClick={() => setMenuOpen(false)}>
                  <User size={18} />
                  Account
                </Link>

                <Link to="/preferiti" onClick={() => setMenuOpen(false)}>
                  <Heart size={18} />
                  Preferiti
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <style>{`
        .desktop-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          flex: 1;
        }

        .nav-link {
          position: relative;
          padding: 30px 0 27px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          transition: color .2s ease;
        }

        .nav-link:hover,
        .nav-link-active {
          color: var(--terracotta);
        }

        .nav-link-active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 19px;
          height: 2px;
          border-radius: 10px;
          background: var(--terracotta);
        }

        .header-icon {
          position: relative;
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--terracotta);
          transition: background .2s ease;
        }

        .header-icon:hover {
          background: rgba(139, 72, 54, 0.08);
        }

        .cart-badge {
          position: absolute;
          top: 1px;
          right: 0;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--terracotta);
          color: white;
          font-size: 9px;
          font-weight: 700;
        }

        .search-bar {
          border-top: 1px solid rgba(112,83,70,.08);
          background: var(--cream);
        }

        .mobile-menu-button,
        .mobile-nav {
          display: none;
        }

        @media (max-width: 1100px) {
          .desktop-nav {
            display: none;
          }

          .mobile-menu-button {
            display: inline-flex;
          }

          .mobile-nav {
            display: block;
            border-top: 1px solid rgba(112,83,70,.1);
            background: var(--cream);
            padding: 10px 0 20px;
          }

          .mobile-nav-link {
            display: block;
            padding: 13px 4px;
            border-bottom: 1px solid rgba(112,83,70,.08);
            font-size: 14px;
            font-weight: 600;
          }

          .mobile-nav-link-active {
            color: var(--terracotta);
          }

          .mobile-nav-secondary {
            display: flex;
            gap: 20px;
            padding-top: 17px;
          }

          .mobile-nav-secondary a {
            display: flex;
            align-items: center;
            gap: 7px;
            color: var(--terracotta);
            font-size: 13px;
            font-weight: 600;
          }
        }

        @media (max-width: 650px) {
          header .container-ery {
            min-height: 70px !important;
          }

          .desktop-icon {
            display: none;
          }

          .header-icon {
            width: 37px;
            height: 37px;
          }
        }
      `}</style>
    </>
  )
}

export default Header