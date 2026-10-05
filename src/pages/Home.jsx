import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Heart,
  Sparkles,
  WandSparkles,
  MessageCircle,
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import ProductCard from '../components/ProductCard'

function Home({ onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })

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

  const availableProducts = products.filter(
    (product) => Number(product.stock || 0) > 0
  )

  const featuredProducts = products.filter(
    (product) => product.featured
  )

  const productsToShow =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 8)
      : availableProducts.slice(0, 8)

  return (
    <main>
      {/* HERO */}
      <section className="home-hero">
        <div className="container-ery hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <Sparkles size={16} />
              Fatto a mano con amore
            </div>

            <h1>
              Intrecci che custodiscono
              <span> i tuoi sogni</span>
            </h1>

            <p>
              Acchiappasogni fatti a mano, pezzi unici e creazioni
              personalizzate realizzate a mano da Erika.
            </p>

            <div className="hero-buttons">
              <Link to="/shop" className="btn-primary">
                Scopri lo Shop
                <ArrowRight size={17} />
              </Link>

              <Link to="/configuratore" className="btn-outline">
                <WandSparkles size={17} />
                Crea il tuo
              </Link>
            </div>

            <div className="hero-notes">
              <span>♡ Fatto a mano</span>
              <span>✦ Personalizzabile</span>
              <span>⌂ Creato in Sardegna</span>
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-circle hero-circle-one" />
            <div className="hero-circle hero-circle-two" />

            <div className="dreamcatcher">
              <div className="dream-ring">
                <div className="dream-web dream-web-one" />
                <div className="dream-web dream-web-two" />
                <div className="dream-center">✦</div>
              </div>

              <div className="dream-thread thread-one">
                <span>❧</span>
              </div>

              <div className="dream-thread thread-two">
                <span>❧</span>
              </div>

              <div className="dream-thread thread-three">
                <span>❧</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="home-intro">
        <div className="container-ery intro-content">
          <span className="section-kicker">Le creazioni di Erika</span>

          <h2>Ogni intreccio racconta una storia</h2>

          <p>
            Ogni acchiappasogni nasce lentamente, scegliendo colori,
            materiali e dettagli per creare qualcosa di speciale e
            personale.
          </p>
        </div>
      </section>

      {/* PRODOTTI */}
      <section className="products-section">
        <div className="container-ery">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                Scelti per te
              </span>

              <h2>I nostri acchiappasogni</h2>
            </div>

            <Link to="/shop" className="section-link">
              Vedi tutto
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading && (
            <div className="home-message">
              Caricamento creazioni...
            </div>
          )}

          {error && (
            <div className="home-message home-error">
              Impossibile caricare i prodotti: {error}
            </div>
          )}

          {!loading && !error && (
            <div className="products-grid">
              {productsToShow.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}

          {!loading && !error && productsToShow.length === 0 && (
            <div className="home-message">
              Le nuove creazioni stanno arrivando.
            </div>
          )}
        </div>
      </section>

      {/* PERSONALIZZATI */}
      <section className="custom-section">
        <div className="container-ery custom-grid">
          <div className="custom-card custom-card-petal">
            <div className="custom-icon">
              <Heart size={28} />
            </div>

            <span className="section-kicker">
              Una creazione solo tua
            </span>

            <h2>Acchiappasogni personalizzati</h2>

            <p>
              Scegli colori, stile, nome o dedica. Raccontaci la tua
              idea e realizzeremo insieme un acchiappasogni unico.
            </p>

            <Link to="/personalizzati" className="btn-primary">
              Scopri i personalizzati
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="custom-card custom-card-sage">
            <div className="custom-icon">
              <WandSparkles size={28} />
            </div>

            <span className="section-kicker">
              Dai forma alla tua idea
            </span>

            <h2>Crea il tuo acchiappasogni</h2>

            <p>
              Usa il configuratore per scegliere forma, colori e
              dettagli e immaginare la tua prossima creazione ERY.
            </p>

            <Link to="/configuratore" className="btn-outline">
              Apri il configuratore
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* SIGNIFICATO */}
      <section className="meaning-section">
        <div className="container-ery meaning-content">
          <div className="meaning-symbol">✦</div>

          <span className="section-kicker">
            Più di una decorazione
          </span>

          <h2>Il significato dell'acchiappasogni</h2>

          <p>
            Un intreccio che richiama protezione, desideri e sogni.
            Ogni creazione ERY è pensata per portare con sé una
            storia e diventare qualcosa da custodire nel tempo.
          </p>
        </div>
      </section>

      {/* ERIKA */}
      <section className="about-preview">
        <div className="container-ery about-preview-grid">
          <div className="about-decoration">
            <div className="about-decoration-ring">
              <Heart size={45} strokeWidth={1.3} />
            </div>
          </div>

          <div className="about-copy">
            <span className="section-kicker">
              Dietro ogni intreccio
            </span>

            <h2>Ciao, sono Erika</h2>

            <p>
              Creo a mano acchiappasogni curando ogni dettaglio,
              dall'idea iniziale fino all'ultimo intreccio. Ogni
              pezzo nasce con il desiderio di creare qualcosa di
              personale e irripetibile.
            </p>

            <Link to="/chi-siamo" className="section-link">
              Conosci la mia storia
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* WHATSAPP */}
      <section className="contact-strip">
        <div className="container-ery contact-strip-inner">
          <div>
            <span className="section-kicker">
              Hai un'idea particolare?
            </span>

            <h2>Parliamone insieme</h2>

            <p>
              Scrivici per informazioni, richieste o per raccontarci
              l'acchiappasogni che vorresti realizzare.
            </p>
          </div>

          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <MessageCircle size={18} />
            Scrivici su WhatsApp
          </a>
        </div>
      </section>

      <style>{`
        .home-hero {
          position: relative;
          overflow: hidden;
          padding: 75px 0 80px;
          background:
            radial-gradient(circle at 85% 30%, rgba(224,169,155,.26), transparent 28%),
            radial-gradient(circle at 12% 75%, rgba(139,151,136,.14), transparent 25%),
            var(--cream);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.08fr .92fr;
          align-items: center;
          min-height: 520px;
          gap: 55px;
        }

        .hero-eyebrow,
        .section-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--terracotta);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .hero-copy h1 {
          max-width: 690px;
          margin: 17px 0 20px;
          font-size: clamp(48px, 6vw, 79px);
          line-height: .92;
          font-weight: 500;
          color: #443731;
        }

        .hero-copy h1 span {
          color: var(--terracotta);
          font-style: italic;
        }

        .hero-copy > p {
          max-width: 610px;
          margin: 0;
          color: #746760;
          font-size: 16px;
          line-height: 1.8;
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .hero-notes {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 27px;
          color: var(--sage);
          font-size: 11px;
          font-weight: 600;
        }

        .hero-art {
          position: relative;
          min-height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-circle {
          position: absolute;
          border-radius: 50%;
        }

        .hero-circle-one {
          width: 390px;
          height: 390px;
          background: rgba(224,169,155,.19);
        }

        .hero-circle-two {
          width: 310px;
          height: 310px;
          border: 1px solid rgba(139,72,54,.15);
        }

        .dreamcatcher {
          position: relative;
          width: 290px;
          height: 430px;
          z-index: 2;
        }

        .dream-ring {
          position: absolute;
          top: 20px;
          left: 35px;
          width: 220px;
          height: 220px;
          border: 7px solid var(--terracotta);
          border-radius: 50%;
          box-shadow:
            inset 0 0 0 2px rgba(255,255,255,.5),
            0 15px 40px rgba(89,54,43,.12);
        }

        .dream-web {
          position: absolute;
          inset: 24px;
          border: 1px solid rgba(139,72,54,.42);
          border-radius: 50%;
        }

        .dream-web-one {
          transform: rotate(45deg);
          border-radius: 38% 62% 45% 55%;
        }

        .dream-web-two {
          inset: 49px;
          border-color: var(--gold);
        }

        .dream-center {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gold);
          font-size: 29px;
        }

        .dream-thread {
          position: absolute;
          top: 230px;
          width: 2px;
          background: var(--terracotta);
          transform-origin: top;
        }

        .dream-thread span {
          position: absolute;
          bottom: -20px;
          left: -11px;
          color: var(--petal);
          font-size: 29px;
        }

        .thread-one {
          left: 85px;
          height: 120px;
          transform: rotate(7deg);
        }

        .thread-two {
          left: 145px;
          height: 165px;
        }

        .thread-three {
          left: 205px;
          height: 120px;
          transform: rotate(-7deg);
        }

        .home-intro {
          padding: 80px 0 30px;
          text-align: center;
        }

        .intro-content {
          max-width: 780px;
        }

        .intro-content h2,
        .section-heading h2,
        .custom-card h2,
        .meaning-content h2,
        .about-copy h2,
        .contact-strip h2 {
          margin: 8px 0 12px;
          color: #443731;
          font-size: clamp(35px, 4vw, 49px);
          line-height: 1;
          font-weight: 500;
        }

        .intro-content p,
        .meaning-content p {
          margin: 0 auto;
          max-width: 680px;
          color: #776b65;
          line-height: 1.8;
          font-size: 14px;
        }

        .products-section {
          padding: 50px 0 90px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 28px;
        }

        .section-heading h2 {
          margin-bottom: 0;
        }

        .section-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--terracotta);
          font-size: 13px;
          font-weight: 700;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }

        .home-message {
          padding: 45px;
          border-radius: 18px;
          background: white;
          text-align: center;
        }

        .home-error {
          color: #9d3f31;
        }

        .custom-section {
          padding: 20px 0 90px;
        }

        .custom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }

        .custom-card {
          position: relative;
          overflow: hidden;
          min-height: 380px;
          padding: 48px;
          border-radius: 30px;
        }

        .custom-card-petal {
          background: rgba(224,169,155,.27);
        }

        .custom-card-sage {
          background: rgba(139,151,136,.17);
        }

        .custom-icon {
          width: 58px;
          height: 58px;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,255,255,.7);
          color: var(--terracotta);
        }

        .custom-card p,
        .about-copy p,
        .contact-strip p {
          max-width: 570px;
          margin: 0 0 25px;
          color: #70645e;
          font-size: 14px;
          line-height: 1.8;
        }

        .meaning-section {
          padding: 90px 0;
          background: #fff;
          text-align: center;
        }

        .meaning-content {
          max-width: 760px;
        }

        .meaning-symbol {
          margin-bottom: 20px;
          color: var(--gold);
          font-size: 35px;
        }

        .about-preview {
          padding: 95px 0;
        }

        .about-preview-grid {
          display: grid;
          grid-template-columns: .8fr 1.2fr;
          align-items: center;
          gap: 75px;
        }

        .about-decoration {
          min-height: 350px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% 50% 46% 54%;
          background: rgba(224,169,155,.2);
        }

        .about-decoration-ring {
          width: 210px;
          height: 210px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--terracotta);
          border-radius: 50%;
          color: var(--terracotta);
        }

        .contact-strip {
          padding: 65px 0;
          background: rgba(139,151,136,.14);
        }

        .contact-strip-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
        }

        .contact-strip h2 {
          font-size: 38px;
        }

        .contact-strip p {
          margin-bottom: 0;
        }

        @media (max-width: 1000px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .custom-card {
            padding: 35px;
          }
        }

        @media (max-width: 780px) {
          .home-hero {
            padding: 55px 0 40px;
          }

          .hero-grid {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .hero-copy {
            text-align: center;
          }

          .hero-copy > p {
            margin-left: auto;
            margin-right: auto;
          }

          .hero-buttons,
          .hero-notes {
            justify-content: center;
          }

          .hero-art {
            min-height: 390px;
            transform: scale(.86);
            margin-top: -20px;
          }

          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .custom-grid,
          .about-preview-grid {
            grid-template-columns: 1fr;
          }

          .about-preview-grid {
            gap: 40px;
          }

          .contact-strip-inner {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 500px) {
          .hero-copy h1 {
            font-size: 46px;
          }

          .hero-art {
            margin-left: -20px;
            margin-right: -20px;
          }

          .home-intro {
            padding-top: 55px;
          }

          .products-section {
            padding-bottom: 65px;
          }

          .products-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .custom-card {
            min-height: 0;
            padding: 30px 24px;
          }

          .about-preview {
            padding: 65px 0;
          }

          .about-decoration {
            min-height: 290px;
          }
        }
      `}</style>
    </main>
  )
}

export default Home