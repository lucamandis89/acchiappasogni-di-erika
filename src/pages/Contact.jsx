import { useState } from 'react'
import {
  CheckCircle2,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
}

function Contact() {
  const [form, setForm] = useState(emptyForm)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()
    const subject = form.subject.trim()
    const message = form.message.trim()

    if (name.length < 2) {
      setError('Inserisci il tuo nome.')
      return
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError('Inserisci un indirizzo email valido.')
      return
    }

    if (message.length < 5) {
      setError('Scrivi un messaggio.')
      return
    }

    setSending(true)
    setError('')
    setSuccess(false)

    try {
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          phone: phone || null,
          subject: subject || 'Richiesta dal sito',
          message,
          is_read: false,
          status: 'new',
        })

      if (insertError) {
        throw insertError
      }

      setForm(emptyForm)
      setSuccess(true)
    } catch (err) {
      console.error('Errore invio messaggio:', err)

      setError(
        err?.message ||
          'Non è stato possibile inviare il messaggio. Riprova.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="container-ery">
          <span className="contact-kicker">
            Parliamo del tuo sogno
          </span>

          <h1>Contattaci</h1>

          <p>
            Hai una domanda, un'idea o desideri una
            creazione speciale? Scrivici. Saremo felici
            di ascoltarti.
          </p>
        </div>
      </section>

      <section className="contact-content">
        <div className="container-ery">
          <div className="contact-layout">
            <div className="contact-info">
              <span className="contact-section-kicker">
                Gli Acchiapasogni di Ery
              </span>

              <h2>
                Ogni creazione nasce da una storia
              </h2>

              <p className="contact-intro">
                Raccontaci cosa immagini. Che si tratti
                di una domanda su un prodotto, di una
                personalizzazione o di un acchiappasogni
                creato apposta per te, puoi scriverci
                direttamente da qui.
              </p>

              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-icon">
                    <Mail size={20} />
                  </div>

                  <div>
                    <strong>Email</strong>
                    <span>
                      Scrivici tramite il modulo
                    </span>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon">
                    <Phone size={20} />
                  </div>

                  <div>
                    <strong>Telefono</strong>
                    <span>
                      Lascia il tuo numero e ti
                      ricontatteremo
                    </span>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon">
                    <MessageCircle size={20} />
                  </div>

                  <div>
                    <strong>Creazioni personalizzate</strong>
                    <span>
                      Raccontaci colori, stile e idea che
                      vorresti realizzare
                    </span>
                  </div>
                </div>
              </div>

              <div className="contact-note">
                <MessageCircle size={18} />

                <p>
                  I messaggi inviati da questa pagina
                  arrivano direttamente nel pannello di
                  amministrazione del negozio.
                </p>
              </div>
            </div>

            <div className="contact-form-card">
              <span className="contact-form-kicker">
                Scrivici
              </span>

              <h2>Inviaci un messaggio</h2>

              <p className="contact-form-intro">
                Compila il modulo e ti risponderemo il
                prima possibile.
              </p>

              {success && (
                <div className="contact-alert success">
                  <CheckCircle2 size={20} />

                  <div>
                    <strong>Messaggio inviato!</strong>
                    <span>
                      Grazie per averci contattato.
                      Ti risponderemo appena possibile.
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="contact-alert error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="contact-form-grid">
                  <label className="contact-field">
                    <span>Nome *</span>

                    <input
                      type="text"
                      className="input-ery"
                      value={form.name}
                      onChange={(event) =>
                        updateField(
                          'name',
                          event.target.value
                        )
                      }
                      placeholder="Il tuo nome"
                      maxLength="100"
                      required
                    />
                  </label>

                  <label className="contact-field">
                    <span>Email *</span>

                    <input
                      type="email"
                      className="input-ery"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          'email',
                          event.target.value
                        )
                      }
                      placeholder="nome@email.it"
                      maxLength="200"
                      required
                    />
                  </label>
                </div>

                <div className="contact-form-grid">
                  <label className="contact-field">
                    <span>Telefono</span>

                    <input
                      type="tel"
                      className="input-ery"
                      value={form.phone}
                      onChange={(event) =>
                        updateField(
                          'phone',
                          event.target.value
                        )
                      }
                      placeholder="+39..."
                      maxLength="50"
                    />
                  </label>

                  <label className="contact-field">
                    <span>Oggetto</span>

                    <input
                      type="text"
                      className="input-ery"
                      value={form.subject}
                      onChange={(event) =>
                        updateField(
                          'subject',
                          event.target.value
                        )
                      }
                      placeholder="Come possiamo aiutarti?"
                      maxLength="200"
                    />
                  </label>
                </div>

                <label className="contact-field">
                  <span>Messaggio *</span>

                  <textarea
                    className="input-ery"
                    rows="7"
                    value={form.message}
                    onChange={(event) =>
                      updateField(
                        'message',
                        event.target.value
                      )
                    }
                    placeholder="Raccontaci la tua idea o scrivi la tua domanda..."
                    maxLength="5000"
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="btn-primary contact-submit"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="contact-spinner"
                      />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      Invia messaggio
                    </>
                  )}
                </button>
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
  .contact-page {
    min-height: 75vh;
    background: #fffdfb;
  }

  .contact-hero {
    padding: 75px 0 65px;
    text-align: center;
    background:
      radial-gradient(
        circle at 20% 25%,
        rgba(224,169,155,.15),
        transparent 34%
      ),
      radial-gradient(
        circle at 82% 70%,
        rgba(144,153,139,.11),
        transparent 32%
      ),
      #fbf8f5;
    border-bottom: 1px solid rgba(112,83,70,.08);
  }

  .contact-kicker,
  .contact-section-kicker,
  .contact-form-kicker {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .contact-kicker {
    display: block;
    margin-bottom: 8px;
  }

  .contact-hero h1 {
    margin: 0 0 14px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(46px, 7vw, 68px);
    font-weight: 500;
    line-height: 1;
  }

  .contact-hero p {
    max-width: 630px;
    margin: 0 auto;
    color: #7d7069;
    font-size: 13px;
    line-height: 1.8;
  }

  .contact-content {
    padding: 65px 0 95px;
  }

  .contact-layout {
    max-width: 1080px;
    margin: 0 auto;
    display: grid;
    grid-template-columns:
      minmax(0, .85fr)
      minmax(0, 1.15fr);
    gap: 55px;
    align-items: start;
  }

  .contact-info {
    padding-top: 15px;
  }

  .contact-info h2 {
    max-width: 430px;
    margin: 7px 0 15px;
    color: #493d37;
    font-family: 'Cormorant Garamond', serif;
    font-size: 39px;
    font-weight: 500;
    line-height: 1.05;
  }

  .contact-intro {
    max-width: 470px;
    margin: 0;
    color: #776b65;
    font-size: 12px;
    line-height: 1.85;
  }

  .contact-info-list {
    display: grid;
    gap: 18px;
    margin-top: 32px;
  }

  .contact-info-item {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .contact-icon {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(224,169,155,.15);
    color: var(--terracotta);
  }

  .contact-info-item div:last-child {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .contact-info-item strong {
    color: #554943;
    font-size: 11px;
  }

  .contact-info-item span {
    color: #8a7e77;
    font-size: 10px;
    line-height: 1.5;
  }

  .contact-note {
    margin-top: 32px;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border-radius: 14px;
    background: rgba(144,153,139,.09);
    color: var(--sage);
  }

  .contact-note svg {
    flex: 0 0 auto;
    margin-top: 1px;
  }

  .contact-note p {
    margin: 0;
    color: #736d68;
    font-size: 10px;
    line-height: 1.7;
  }

  .contact-form-card {
    padding: 32px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 23px;
    background: white;
    box-shadow: 0 15px 45px rgba(73,54,45,.055);
  }

  .contact-form-card h2 {
    margin: 5px 0 5px;
    color: #493d37;
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px;
    font-weight: 500;
  }

  .contact-form-intro {
    margin: 0 0 25px;
    color: #8a7d76;
    font-size: 10px;
  }

  .contact-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .contact-field {
    display: block;
    margin-bottom: 16px;
  }

  .contact-field > span {
    display: block;
    margin-bottom: 7px;
    color: #615650;
    font-size: 10px;
    font-weight: 600;
  }

  .contact-field input,
  .contact-field textarea {
    width: 100%;
  }

  .contact-field textarea {
    resize: vertical;
  }

  .contact-submit {
    width: 100%;
    min-height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }

  .contact-submit:disabled {
    opacity: .65;
    cursor: wait;
  }

  .contact-alert {
    margin-bottom: 20px;
    padding: 13px 15px;
    border-radius: 12px;
    font-size: 10px;
  }

  .contact-alert.success {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .contact-alert.success svg {
    flex: 0 0 auto;
  }

  .contact-alert.success div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .contact-alert.success strong {
    font-size: 11px;
  }

  .contact-alert.error {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .contact-spinner {
    animation: contact-spin 1s linear infinite;
  }

  @keyframes contact-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 850px) {
    .contact-layout {
      grid-template-columns: 1fr;
      gap: 40px;
    }

    .contact-info {
      padding-top: 0;
    }
  }

  @media (max-width: 600px) {
    .contact-hero {
      padding: 55px 0 48px;
    }

    .contact-content {
      padding: 40px 0 70px;
    }

    .contact-form-card {
      padding: 23px 18px;
      border-radius: 18px;
    }

    .contact-form-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .contact-info h2 {
      font-size: 34px;
    }
  }
`

export default Contact
