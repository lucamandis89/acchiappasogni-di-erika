import { useState } from 'react'
import {
  CheckCircle2,
  Heart,
  LoaderCircle,
  Send,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

function Personalizzati() {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    title: '',
    description: '',
    budget: '',
  })

  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const customerName =
      form.customer_name.trim()

    const customerEmail =
      form.customer_email.trim()

    const customerPhone =
      form.customer_phone.trim()

    const title =
      form.title.trim()

    const description =
      form.description.trim()

    const budgetText =
      String(form.budget || '').trim()

    if (customerName.length < 2) {
      setError('Inserisci il tuo nome.')
      return
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        customerEmail
      )
    ) {
      setError(
        'Inserisci un indirizzo email valido.'
      )
      return
    }

    if (title.length < 2) {
      setError(
        'Inserisci un titolo per il tuo progetto.'
      )
      return
    }

    if (description.length < 5) {
      setError(
        'Descrivi un po’ meglio il tuo acchiappasogni.'
      )
      return
    }

    let budget = null

    if (budgetText !== '') {
      budget = Number(
        budgetText.replace(',', '.')
      )

      if (
        !Number.isFinite(budget) ||
        budget < 0
      ) {
        setError(
          'Inserisci un budget valido.'
        )
        return
      }
    }

    setSending(true)
    setError('')
    setSuccess(false)

    try {
      const { error: insertError } =
        await supabase
          .from('custom_projects')
          .insert({
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone:
              customerPhone || null,
            title,
            description,
            budget,
            images: [],
            status: 'new',
            admin_notes: null,
          })

      if (insertError) {
        throw insertError
      }

      setForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        title: '',
        description: '',
        budget: '',
      })

      setSuccess(true)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Non è stato possibile inviare la richiesta.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="custom-page">
      <section className="custom-hero">
        <div className="container-ery">
          <span className="custom-kicker">
            Creato insieme a te
          </span>

          <h1>
            Il tuo acchiappasogni,
            <br />
            <em>proprio come lo immagini</em>
          </h1>

          <p>
            Racconta a Erika la tua idea: colori,
            stile, significato, persona a cui è
            destinato e ogni dettaglio che vorresti
            rendere speciale.
          </p>
        </div>
      </section>

      {success && (
        <section className="custom-success-section">
          <div className="container-ery">
            <div className="custom-success">
              <CheckCircle2 size={26} />

              <div>
                <strong>
                  Richiesta inviata!
                </strong>

                <span>
                  Erika ha ricevuto il tuo progetto e
                  potrà ricontattarti per definire
                  insieme tutti i dettagli.
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="custom-intro">
        <div className="container-ery">
          <div className="custom-intro-grid">
            <div className="custom-intro-copy">
              <span className="custom-kicker">
                Un pezzo solo tuo
              </span>

              <h2>
                Da un'idea nasce
                <br />
                qualcosa di unico
              </h2>

              <p>
                Un nome, un colore particolare, un
                ricordo, una nascita, un regalo o
                semplicemente qualcosa che hai
                immaginato: ogni progetto può partire
                da una storia diversa.
              </p>

              <p>
                Compila il modulo raccontando ciò che
                vorresti. Erika valuterà la richiesta
                e potrà contattarti per definire
                materiali, dettagli, tempi e prezzo.
              </p>
            </div>

            <div className="custom-features">
              <article>
                <div className="custom-feature-icon">
                  <WandSparkles size={22} />
                </div>

                <div>
                  <h3>La tua idea</h3>
                  <p>
                    Descrivi liberamente colori,
                    dimensioni, stile e dettagli.
                  </p>
                </div>
              </article>

              <article>
                <div className="custom-feature-icon">
                  <Heart size={22} />
                </div>

                <div>
                  <h3>Fatto a mano</h3>
                  <p>
                    Il progetto viene trasformato in
                    una creazione artigianale.
                  </p>
                </div>
              </article>

              <article>
                <div className="custom-feature-icon">
                  <Sparkles size={22} />
                </div>

                <div>
                  <h3>Unico</h3>
                  <p>
                    Ogni personalizzato nasce per una
                    persona e una storia precisa.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="custom-form-section">
        <div className="container-ery">
          <div className="custom-form-layout">
            <div className="custom-form-copy">
              <span className="custom-kicker">
                Raccontami il tuo progetto
              </span>

              <h2>
                Iniziamo dal tuo sogno
              </h2>

              <p>
                Non serve avere già tutto deciso.
                Scrivi ciò che immagini e lascia pure
                a Erika la possibilità di proporti
                idee e soluzioni.
              </p>

              <div className="custom-tip">
                <Sparkles size={18} />

                <span>
                  Più dettagli inserisci, più sarà
                  semplice capire lo stile che stai
                  cercando.
                </span>
              </div>
            </div>

            <div className="custom-form-card">
              {error && (
                <div className="custom-alert error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="custom-two-columns">
                  <label className="custom-field">
                    <span>Nome *</span>

                    <input
                      type="text"
                      className="input-ery"
                      placeholder="Il tuo nome"
                      value={form.customer_name}
                      maxLength="100"
                      onChange={(event) =>
                        updateField(
                          'customer_name',
                          event.target.value
                        )
                      }
                      required
                    />
                  </label>

                  <label className="custom-field">
                    <span>Email *</span>

                    <input
                      type="email"
                      className="input-ery"
                      placeholder="nome@email.it"
                      value={form.customer_email}
                      maxLength="200"
                      onChange={(event) =>
                        updateField(
                          'customer_email',
                          event.target.value
                        )
                      }
                      required
                    />
                  </label>
                </div>

                <div className="custom-two-columns">
                  <label className="custom-field">
                    <span>Telefono</span>

                    <input
                      type="tel"
                      className="input-ery"
                      placeholder="Facoltativo"
                      value={form.customer_phone}
                      maxLength="40"
                      onChange={(event) =>
                        updateField(
                          'customer_phone',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="custom-field">
                    <span>Budget indicativo €</span>

                    <input
                      type="number"
                      className="input-ery"
                      placeholder="Es. 50"
                      min="0"
                      step="0.01"
                      value={form.budget}
                      onChange={(event) =>
                        updateField(
                          'budget',
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <label className="custom-field">
                  <span>
                    Come immagini il tuo progetto? *
                  </span>

                  <input
                    type="text"
                    className="input-ery"
                    placeholder="Es. Acchiappasogni per la cameretta di Sofia"
                    value={form.title}
                    maxLength="200"
                    onChange={(event) =>
                      updateField(
                        'title',
                        event.target.value
                      )
                    }
                    required
                  />
                </label>

                <label className="custom-field">
                  <span>
                    Racconta la tua idea *
                  </span>

                  <textarea
                    className="input-ery"
                    rows="8"
                    placeholder="Colori, dimensioni, nome, stile, occasione, significato o qualsiasi dettaglio tu abbia in mente..."
                    value={form.description}
                    maxLength="5000"
                    onChange={(event) =>
                      updateField(
                        'description',
                        event.target.value
                      )
                    }
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="btn-primary custom-submit"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="custom-spinner"
                      />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Invia il mio progetto
                    </>
                  )}
                </button>

                <p className="custom-form-note">
                  L'invio della richiesta non comporta
                  alcun obbligo di acquisto. Erika ti
                  ricontatterà prima di procedere con
                  la realizzazione.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .custom-page {
    min-height: 75vh;
    background: #fffdfb;
  }

  .custom-hero {
    padding: 90px 0 85px;
    text-align: center;
    background:
      radial-gradient(
        circle at 18% 22%,
        rgba(224,169,155,.18),
        transparent 34%
      ),
      radial-gradient(
        circle at 84% 70%,
        rgba(144,153,139,.13),
        transparent 32%
      ),
      #fbf8f5;
    border-bottom:
      1px solid rgba(112,83,70,.08);
  }

  .custom-kicker {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .custom-hero h1 {
    margin: 8px 0 18px;
    color: #443731;
    font-family:
      'Cormorant Garamond', serif;
    font-size: clamp(48px, 7vw, 72px);
    font-weight: 500;
    line-height: 1;
  }

  .custom-hero h1 em {
    color: var(--terracotta);
    font-weight: 400;
  }

  .custom-hero p {
    max-width: 650px;
    margin: 0 auto;
    color: #7d7069;
    font-size: 13px;
    line-height: 1.9;
  }

  .custom-success-section {
    padding-top: 30px;
  }

  .custom-success {
    max-width: 850px;
    margin: 0 auto;
    padding: 18px 22px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-radius: 14px;
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .custom-success div {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .custom-success strong {
    font-size: 12px;
  }

  .custom-success span {
    font-size: 10px;
    line-height: 1.6;
  }

  .custom-intro {
    padding: 85px 0;
  }

  .custom-intro-grid {
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }

  .custom-intro-copy h2,
  .custom-form-copy h2 {
    margin: 6px 0 20px;
    color: #493d37;
    font-family:
      'Cormorant Garamond', serif;
    font-size: 42px;
    font-weight: 500;
    line-height: 1.05;
  }

  .custom-intro-copy p,
  .custom-form-copy > p {
    margin: 0 0 16px;
    color: #786b64;
    font-size: 11px;
    line-height: 1.9;
  }

  .custom-features {
    display: grid;
    gap: 14px;
  }

  .custom-features article {
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    border:
      1px solid rgba(112,83,70,.10);
    border-radius: 16px;
    background: white;
  }

  .custom-feature-icon {
    width: 46px;
    height: 46px;
    flex: 0 0 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background:
      rgba(224,169,155,.16);
    color: var(--terracotta);
  }

  .custom-features h3 {
    margin: 0 0 3px;
    color: #51443e;
    font-family:
      'Cormorant Garamond', serif;
    font-size: 22px;
  }

  .custom-features p {
    margin: 0;
    color: #887b74;
    font-size: 9px;
    line-height: 1.6;
  }

  .custom-form-section {
    padding: 85px 0 100px;
    background: #faf7f4;
  }

  .custom-form-layout {
    max-width: 1050px;
    margin: 0 auto;
    display: grid;
    grid-template-columns:
      minmax(250px, .75fr)
      minmax(0, 1.25fr);
    gap: 65px;
    align-items: start;
  }

  .custom-form-copy {
    padding-top: 25px;
  }

  .custom-tip {
    margin-top: 25px;
    padding: 16px;
    display: flex;
    gap: 10px;
    border-radius: 13px;
    background:
      rgba(224,169,155,.12);
    color: #765a50;
    font-size: 9px;
    line-height: 1.6;
  }

  .custom-tip svg {
    flex: 0 0 auto;
    color: var(--terracotta);
  }

  .custom-form-card {
    padding: 32px;
    border:
      1px solid rgba(112,83,70,.10);
    border-radius: 22px;
    background: white;
    box-shadow:
      0 16px 45px rgba(73,54,45,.05);
  }

  .custom-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .custom-field {
    display: block;
    margin-bottom: 15px;
  }

  .custom-field > span {
    display: block;
    margin-bottom: 6px;
    color: #615650;
    font-size: 10px;
    font-weight: 600;
  }

  .custom-field input,
  .custom-field textarea {
    width: 100%;
  }

  .custom-field textarea {
    resize: vertical;
  }

  .custom-submit {
    width: 100%;
    min-height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .custom-submit:disabled {
    opacity: .6;
    cursor: wait;
  }

  .custom-form-note {
    margin: 13px 0 0;
    color: #9a8e87;
    font-size: 8px;
    line-height: 1.6;
    text-align: center;
  }

  .custom-alert {
    margin-bottom: 18px;
    padding: 12px 14px;
    border-radius: 11px;
    font-size: 10px;
  }

  .custom-alert.error {
    background:
      rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .custom-spinner {
    animation:
      custom-spin 1s linear infinite;
  }

  @keyframes custom-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 850px) {
    .custom-intro-grid,
    .custom-form-layout {
      grid-template-columns: 1fr;
      gap: 45px;
    }

    .custom-form-copy {
      padding-top: 0;
    }
  }

  @media (max-width: 600px) {
    .custom-hero {
      padding: 60px 0 55px;
    }

    .custom-intro,
    .custom-form-section {
      padding: 60px 0;
    }

    .custom-intro-copy h2,
    .custom-form-copy h2 {
      font-size: 35px;
    }

    .custom-two-columns {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .custom-form-card {
      padding: 23px 18px;
    }
  }
`

export default Personalizzati