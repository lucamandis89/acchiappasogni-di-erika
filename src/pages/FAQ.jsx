import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  HelpCircle,
  LoaderCircle,
  MessageCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function FAQ() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [selectedCategory, setSelectedCategory] =
    useState('Tutte')

  useEffect(() => {
    loadFaqs()
  }, [])

  async function loadFaqs() {
    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } = await supabase
        .from('faqs')
        .select(
          'id, question, answer, category, order, active'
        )
        .eq('active', true)
        .order('order', { ascending: true })
        .order('created_at', { ascending: true })

      if (loadError) {
        throw loadError
      }

      setFaqs(data || [])
    } catch (err) {
      console.error('Errore caricamento FAQ:', err)

      setError(
        err?.message ||
          'Non è stato possibile caricare le domande frequenti.'
      )
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const values = faqs
      .map((faq) => faq.category?.trim())
      .filter(Boolean)

    return ['Tutte', ...new Set(values)]
  }, [faqs])

  const visibleFaqs = useMemo(() => {
    if (selectedCategory === 'Tutte') {
      return faqs
    }

    return faqs.filter(
      (faq) => faq.category === selectedCategory
    )
  }, [faqs, selectedCategory])

  function toggleFaq(id) {
    setOpenId((current) =>
      current === id ? null : id
    )
  }

  return (
    <main className="public-faq-page">
      <section className="faq-hero">
        <div className="container-ery">
          <span className="faq-kicker">
            Siamo qui per aiutarti
          </span>

          <h1>Domande frequenti</h1>

          <p>
            Tutto quello che potresti voler sapere sui
            nostri acchiappasogni, sugli ordini, sulle
            personalizzazioni e sulle spedizioni.
          </p>
        </div>
      </section>

      <section className="faq-content">
        <div className="container-ery">
          {loading ? (
            <div className="faq-state">
              <LoaderCircle
                size={32}
                className="faq-spinner"
              />

              <span>Caricamento FAQ...</span>
            </div>
          ) : error ? (
            <div className="faq-state faq-error">
              <HelpCircle size={34} />

              <h2>Qualcosa non ha funzionato</h2>

              <p>{error}</p>

              <button
                type="button"
                className="btn-outline"
                onClick={loadFaqs}
              >
                Riprova
              </button>
            </div>
          ) : faqs.length === 0 ? (
            <div className="faq-state">
              <HelpCircle size={38} />

              <h2>Nessuna FAQ disponibile</h2>

              <p>
                Le domande frequenti saranno disponibili
                presto.
              </p>
            </div>
          ) : (
            <>
              {categories.length > 2 && (
                <div className="faq-categories">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={
                        selectedCategory === category
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setSelectedCategory(category)
                      }
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              <div className="faq-layout">
                <div className="faq-list-public">
                  {visibleFaqs.map((faq) => {
                    const isOpen =
                      openId === faq.id

                    return (
                      <article
                        key={faq.id}
                        className={`faq-item ${
                          isOpen ? 'open' : ''
                        }`}
                      >
                        <button
                          type="button"
                          className="faq-question"
                          onClick={() =>
                            toggleFaq(faq.id)
                          }
                          aria-expanded={isOpen}
                        >
                          <span>
                            {faq.question}
                          </span>

                          <ChevronDown
                            size={19}
                            className="faq-chevron"
                          />
                        </button>

                        {isOpen && (
                          <div className="faq-answer">
                            <p>{faq.answer}</p>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>

                <aside className="faq-help-card">
                  <div className="faq-help-icon">
                    <MessageCircle size={26} />
                  </div>

                  <span>Hai ancora un dubbio?</span>

                  <h2>Parliamone insieme</h2>

                  <p>
                    Ogni creazione è speciale. Se non hai
                    trovato la risposta che cercavi,
                    scrivici e saremo felici di aiutarti.
                  </p>

                  <Link
                    to="/contatti"
                    className="btn-primary"
                  >
                    Contattaci
                  </Link>

                  <Link
                    to="/personalizzati"
                    className="faq-custom-link"
                  >
                    Scopri le creazioni personalizzate
                  </Link>
                </aside>
              </div>
            </>
          )}
        </div>
      </section>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .public-faq-page {
    min-height: 75vh;
    background: #fffdfb;
  }

  .faq-hero {
    padding: 75px 0 65px;
    text-align: center;
    background:
      radial-gradient(
        circle at 20% 20%,
        rgba(224,169,155,.14),
        transparent 34%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(144,153,139,.11),
        transparent 32%
      ),
      #fbf8f5;
    border-bottom: 1px solid rgba(112,83,70,.08);
  }

  .faq-kicker {
    display: block;
    margin-bottom: 8px;
    color: var(--terracotta);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }

  .faq-hero h1 {
    margin: 0 0 14px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(46px, 7vw, 68px);
    font-weight: 500;
    line-height: 1;
  }

  .faq-hero p {
    max-width: 650px;
    margin: 0 auto;
    color: #7d7069;
    font-size: 13px;
    line-height: 1.8;
  }

  .faq-content {
    padding: 55px 0 90px;
  }

  .faq-state {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-align: center;
    color: #8a7d76;
  }

  .faq-state svg {
    color: var(--terracotta);
  }

  .faq-state h2 {
    margin: 5px 0 0;
    color: #4f433d;
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px;
    font-weight: 500;
  }

  .faq-state p {
    max-width: 500px;
    margin: 0 0 10px;
    font-size: 11px;
    line-height: 1.7;
  }

  .faq-error {
    color: #92534d;
  }

  .faq-spinner {
    animation: public-faq-spin 1s linear infinite;
  }

  @keyframes public-faq-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .faq-categories {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 35px;
  }

  .faq-categories button {
    min-height: 37px;
    padding: 0 15px;
    border: 1px solid rgba(112,83,70,.13);
    border-radius: 30px;
    background: white;
    color: #756963;
    cursor: pointer;
    font-family: inherit;
    font-size: 10px;
    transition: .2s ease;
  }

  .faq-categories button:hover,
  .faq-categories button.active {
    border-color: var(--terracotta);
    background: var(--terracotta);
    color: white;
  }

  .faq-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 310px;
    gap: 38px;
    align-items: start;
    max-width: 1050px;
    margin: 0 auto;
  }

  .faq-list-public {
    display: flex;
    flex-direction: column;
    gap: 11px;
  }

  .faq-item {
    overflow: hidden;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 17px;
    background: white;
    transition:
      border-color .2s ease,
      box-shadow .2s ease;
  }

  .faq-item.open {
    border-color: rgba(156,91,69,.22);
    box-shadow: 0 10px 30px rgba(73,54,45,.05);
  }

  .faq-question {
    width: 100%;
    min-height: 68px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border: 0;
    background: transparent;
    color: #50443e;
    cursor: pointer;
    text-align: left;
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 600;
  }

  .faq-question span {
    flex: 1;
  }

  .faq-chevron {
    flex: 0 0 auto;
    color: var(--terracotta);
    transition: transform .2s ease;
  }

  .faq-item.open .faq-chevron {
    transform: rotate(180deg);
  }

  .faq-answer {
    padding: 0 20px 21px;
  }

  .faq-answer p {
    margin: 0;
    padding-top: 16px;
    border-top: 1px solid rgba(112,83,70,.08);
    color: #756a64;
    font-size: 12px;
    line-height: 1.85;
    white-space: pre-wrap;
  }

  .faq-help-card {
    position: sticky;
    top: 105px;
    padding: 29px 25px;
    text-align: center;
    border: 1px solid rgba(112,83,70,.10);
    border-radius: 22px;
    background: #fbf7f3;
  }

  .faq-help-icon {
    width: 57px;
    height: 57px;
    margin: 0 auto 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(224,169,155,.17);
    color: var(--terracotta);
  }

  .faq-help-card > span {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .faq-help-card h2 {
    margin: 6px 0 10px;
    color: #493d37;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 500;
  }

  .faq-help-card p {
    margin: 0 0 20px;
    color: #7b6f69;
    font-size: 11px;
    line-height: 1.75;
  }

  .faq-help-card .btn-primary {
    width: 100%;
    display: inline-flex;
    justify-content: center;
    text-decoration: none;
  }

  .faq-custom-link {
    display: block;
    margin-top: 14px;
    color: #766961;
    font-size: 9px;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 850px) {
    .faq-layout {
      grid-template-columns: 1fr;
    }

    .faq-help-card {
      position: static;
      max-width: 500px;
      width: 100%;
      margin: 10px auto 0;
    }
  }

  @media (max-width: 600px) {
    .faq-hero {
      padding: 55px 0 48px;
    }

    .faq-content {
      padding: 38px 0 65px;
    }

    .faq-hero p {
      font-size: 12px;
    }

    .faq-categories {
      justify-content: flex-start;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 5px;
    }

    .faq-categories button {
      flex: 0 0 auto;
    }

    .faq-question {
      min-height: 62px;
      padding: 16px;
      font-size: 18px;
    }

    .faq-answer {
      padding: 0 16px 18px;
    }

    .faq-help-card {
      padding: 25px 20px;
    }
  }
`

export default FAQ