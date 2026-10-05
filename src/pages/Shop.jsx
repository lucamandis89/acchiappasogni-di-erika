import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../supabaseClient'
import ProductCard from '../components/ProductCard'

function Shop({ onAddToCart }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [databaseCategories,setDatabaseCategories]=useState([])
  useEffect(()=>{supabase.from('categories').select('name').eq('active',true).order('order',{ascending:true}).then(({data,error})=>{if(!error)setDatabaseCategories(data||[])})},[])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileFilters, setMobileFilters] = useState(false)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('cat') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent')
  const [availability, setAvailability] = useState(
    searchParams.get('avail') || 'all'
  )
  const [personalizable, setPersonalizable] = useState(
    searchParams.get('pers') === 'true'
  )

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)

      if (error) {
        console.error(error)
        setError(error.message)
      } else {
        setProducts(data || [])
      }

      setLoading(false)
    }

    loadProducts()
  }, [])

  useEffect(() => {
    const params = {}

    if (search.trim()) params.q = search.trim()
    if (category !== 'all') params.cat = category
    if (sort !== 'recent') params.sort = sort
    if (availability !== 'all') params.avail = availability
    if (personalizable) params.pers = 'true'

    setSearchParams(params, { replace: true })
  }, [
    search,
    category,
    sort,
    availability,
    personalizable,
    setSearchParams,
  ])

  const categories = useMemo(() => {
    const values = [...databaseCategories.map(c=>c.name),...products
      .map((product) => product.category_name)
      .filter(Boolean)]

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b, 'it')
    )
  }, [products,databaseCategories])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    const query = search.trim().toLowerCase()

    if (query) {
      result = result.filter((product) => {
        const text = [
          product.name,
          product.sku,
          product.category_name,
          product.short_description,
          product.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return text.includes(query)
      })
    }

    if (category !== 'all') {
      result = result.filter(
        (product) => product.category_name === category
      )
    }

    if (availability === 'available') {
      result = result.filter(
        (product) => Number(product.stock || 0) > 0
      )
    }

    if (availability === 'soldout') {
      result = result.filter(
        (product) => Number(product.stock || 0) <= 0
      )
    }

    if (personalizable) {
      result = result.filter(
        (product) => product.personalizable === true
      )
    }

    result.sort((a, b) => {
      const priceA = Number(a.sale_price || a.price || 0)
      const priceB = Number(b.sale_price || b.price || 0)

      if (sort === 'price-asc') {
        return priceA - priceB
      }

      if (sort === 'price-desc') {
        return priceB - priceA
      }

      if (sort === 'name') {
        return String(a.name || '').localeCompare(
          String(b.name || ''),
          'it'
        )
      }

      if (sort === 'popular') {
        return (
          Number(b.sales_count || 0) -
          Number(a.sales_count || 0)
        )
      }

      return String(b.created_at || '').localeCompare(
        String(a.created_at || '')
      )
    })

    return result
  }, [
    products,
    search,
    category,
    availability,
    personalizable,
    sort,
  ])

  function resetFilters() {
    setSearch('')
    setCategory('all')
    setSort('recent')
    setAvailability('all')
    setPersonalizable(false)
  }

  const filters = (
    <>
      <div className="shop-filter-block">
        <label className="label-ery">Categoria</label>

        <select
          className="input-ery"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">Tutte le categorie</option>

          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="shop-filter-block">
        <label className="label-ery">Disponibilità</label>

        <select
          className="input-ery"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        >
          <option value="all">Tutti</option>
          <option value="available">Disponibili</option>
          <option value="soldout">Esauriti</option>
        </select>
      </div>

      <label className="personalizable-check">
        <input
          type="checkbox"
          checked={personalizable}
          onChange={(e) => setPersonalizable(e.target.checked)}
        />

        <span>Solo personalizzabili</span>
      </label>

      <button
        type="button"
        className="reset-filters"
        onClick={resetFilters}
      >
        <X size={15} />
        Azzera filtri
      </button>
    </>
  )

  return (
    <main>
      <section className="shop-hero">
        <div className="container-ery">
          <span className="shop-kicker">
            Creazioni fatte a mano ERY
          </span>

          <h1>Shop</h1>

          <p>
            Scopri gli acchiappasogni realizzati a mano da Erika:
            pezzi unici, idee regalo e creazioni personalizzabili.
          </p>
        </div>
      </section>

      <section className="shop-section">
        <div className="container-ery">
          <div className="shop-toolbar">
            <div className="shop-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Cerca un acchiappasogni..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="shop-toolbar-right">
              <button
                type="button"
                className="mobile-filter-button"
                onClick={() => setMobileFilters(true)}
              >
                <SlidersHorizontal size={17} />
                Filtri
              </button>

              <select
                className="shop-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Ordina prodotti"
              >
                <option value="recent">Più recenti</option>
                <option value="price-asc">
                  Prezzo: dal più basso
                </option>
                <option value="price-desc">
                  Prezzo: dal più alto
                </option>
                <option value="name">Nome A-Z</option>
                <option value="popular">Più venduti</option>
              </select>
            </div>
          </div>

          <div className="shop-layout">
            <aside className="shop-sidebar">
              <div className="filter-title">
                <SlidersHorizontal size={17} />
                Filtra
              </div>

              {filters}
            </aside>

            <div className="shop-results">
              <div className="results-count">
                {loading
                  ? 'Caricamento...'
                  : `${filteredProducts.length} ${
                      filteredProducts.length === 1
                        ? 'prodotto'
                        : 'prodotti'
                    }`}
              </div>

              {error && (
                <div className="shop-message">
                  Errore durante il caricamento: {error}
                </div>
              )}

              {!loading &&
                !error &&
                filteredProducts.length > 0 && (
                  <div className="shop-products-grid">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={onAddToCart}
                      />
                    ))}
                  </div>
                )}

              {!loading &&
                !error &&
                filteredProducts.length === 0 && (
                  <div className="shop-empty">
                    <h2>Nessun prodotto trovato</h2>

                    <p>
                      Prova a modificare la ricerca o i filtri.
                    </p>

                    <button
                      type="button"
                      className="btn-outline"
                      onClick={resetFilters}
                    >
                      Azzera i filtri
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>

      {mobileFilters && (
        <div
          className="filter-overlay"
          onClick={() => setMobileFilters(false)}
        >
          <div
            className="mobile-filter-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-filter-header">
              <strong>Filtri</strong>

              <button
                type="button"
                onClick={() => setMobileFilters(false)}
              >
                <X size={22} />
              </button>
            </div>

            {filters}

            <button
              type="button"
              className="btn-primary mobile-filter-done"
              onClick={() => setMobileFilters(false)}
            >
              Mostra {filteredProducts.length} prodotti
            </button>
          </div>
        </div>
      )}

      <style>{`
        .shop-hero {
          padding: 70px 0 60px;
          text-align: center;
          background:
            radial-gradient(circle at 20% 20%, rgba(224,169,155,.18), transparent 25%),
            radial-gradient(circle at 80% 70%, rgba(139,151,136,.12), transparent 25%),
            var(--cream);
        }

        .shop-kicker {
          color: var(--terracotta);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .shop-hero h1 {
          margin: 8px 0 12px;
          color: #443731;
          font-size: clamp(48px, 7vw, 72px);
          font-weight: 500;
          line-height: 1;
        }

        .shop-hero p {
          max-width: 650px;
          margin: 0 auto;
          color: #776b65;
          font-size: 14px;
          line-height: 1.7;
        }

        .shop-section {
          padding: 45px 0 90px;
        }

        .shop-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 30px;
        }

        .shop-search {
          width: min(100%, 480px);
          min-height: 47px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          border: 1px solid rgba(112,83,70,.2);
          border-radius: 999px;
          background: white;
          color: var(--sage);
        }

        .shop-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #443731;
        }

        .shop-toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .shop-sort {
          min-height: 44px;
          padding: 0 14px;
          border: 1px solid rgba(112,83,70,.2);
          border-radius: 12px;
          background: white;
          color: #443731;
          outline: 0;
        }

        .mobile-filter-button {
          display: none;
          min-height: 44px;
          align-items: center;
          gap: 7px;
          padding: 0 14px;
          border: 1px solid var(--terracotta);
          border-radius: 12px;
          background: transparent;
          color: var(--terracotta);
          font-weight: 600;
        }

        .shop-layout {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 35px;
        }

        .shop-sidebar {
          align-self: start;
          position: sticky;
          top: 110px;
          padding: 23px;
          border: 1px solid rgba(112,83,70,.11);
          border-radius: 20px;
          background: white;
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 23px;
          color: var(--terracotta);
          font-weight: 700;
        }

        .shop-filter-block {
          margin-bottom: 20px;
        }

        .personalizable-check {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 8px 0 22px;
          font-size: 13px;
          cursor: pointer;
        }

        .personalizable-check input {
          width: 17px;
          height: 17px;
          accent-color: var(--terracotta);
        }

        .reset-filters {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--terracotta);
          font-size: 12px;
          font-weight: 600;
        }

        .results-count {
          margin-bottom: 17px;
          color: #8b807a;
          font-size: 12px;
          font-weight: 600;
        }

        .shop-products-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .shop-message,
        .shop-empty {
          padding: 55px 25px;
          border-radius: 22px;
          background: white;
          text-align: center;
        }

        .shop-empty h2 {
          margin-bottom: 8px;
          font-size: 32px;
          color: #443731;
        }

        .shop-empty p {
          margin-bottom: 22px;
          color: #776b65;
        }

        .filter-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: flex;
          justify-content: flex-end;
          background: rgba(50,40,35,.35);
        }

        .mobile-filter-panel {
          width: min(86%, 360px);
          height: 100%;
          overflow-y: auto;
          padding: 24px;
          background: var(--cream);
          box-shadow: -10px 0 35px rgba(0,0,0,.12);
        }

        .mobile-filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          color: var(--terracotta);
          font-size: 20px;
        }

        .mobile-filter-header button {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: white;
          color: var(--terracotta);
        }

        .mobile-filter-done {
          width: 100%;
          margin-top: 30px;
        }

        @media (max-width: 1050px) {
          .shop-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .shop-section {
            padding-top: 30px;
          }

          .shop-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .shop-search {
            width: 100%;
          }

          .shop-toolbar-right {
            justify-content: space-between;
          }

          .mobile-filter-button {
            display: inline-flex;
          }

          .shop-sort {
            flex: 1;
            min-width: 0;
          }

          .shop-layout {
            display: block;
          }

          .shop-sidebar {
            display: none;
          }
        }

        @media (max-width: 500px) {
          .shop-hero {
            padding: 48px 0 42px;
          }

          .shop-products-grid {
            gap: 10px;
          }

          .shop-toolbar-right {
            align-items: stretch;
          }

          .mobile-filter-button {
            flex: 0 0 auto;
          }

          .shop-sort {
            font-size: 12px;
          }
        }
      `}</style>
    </main>
  )
}

export default Shop