import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  LoaderCircle,
  Send,
  Star,
} from 'lucide-react'
import { supabase } from '../supabaseClient'

function Stars({ value = 0, size = 17 }) {
  const rating = Math.max(
    0,
    Math.min(5, Number(value || 0))
  )

  return (
    <div className="public-review-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={
            star <= rating
              ? 'currentColor'
              : 'none'
          }
        />
      ))}
    </div>
  )
}

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    customer_name: '',
    rating: 5,
    comment: '',
  })

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } =
        await supabase
          .from('reviews')
          .select(
            'id, customer_name, rating, comment, featured, created_at'
          )
          .eq('approved', true)
          .order('featured', {
            ascending: false,
          })
          .order('created_at', {
            ascending: false,
          })

      if (loadError) {
        throw loadError
      }

      setReviews(data || [])
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile caricare le recensioni.'
      )
    } finally {
      setLoading(false)
    }
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function submitReview(event) {
    event.preventDefault()

    const customerName =
      form.customer_name.trim()

    const comment = form.comment.trim()
    const rating = Number(form.rating)

    if (customerName.length < 2) {
      setError('Inserisci il tuo nome.')
      return
    }

    if (
      !Number.isFinite(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      setError(
        'Seleziona una valutazione da 1 a 5 stelle.'
      )
      return
    }

    if (comment.length < 3) {
      setError(
        'Scrivi qualche parola sulla tua esperienza.'
      )
      return
    }

    setSending(true)
    setError('')
    setSuccess(false)

    try {
      const { error: insertError } =
        await supabase
          .from('reviews')
          .insert({
            customer_name: customerName,
            rating,
            comment,
            approved: false,
            featured: false,
          })

      if (insertError) {
        throw insertError
      }

      setForm({
        customer_name: '',
        rating: 5,
        comment: '',
      })

      setSuccess(true)
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Non è stato possibile inviare la recensione.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="public-reviews-page">
      <section className="public-reviews-hero">
        <div className="container-ery">
          <span className="reviews-kicker">
            Le vostre parole
          </span>

          <h1>Recensioni</h1>

          <p>
            Ogni acchiappasogni porta con sé una
            storia. Qui puoi leggere le esperienze di
            chi ha già scelto una creazione di Erika.
          </p>
        </div>
      </section>

      <section className="public-reviews-content">
        <div className="container-ery">
          <div className="reviews-layout">
            <div className="reviews-column">
              <div className="reviews-heading">
                <div>
                  <span>Esperienze</span>
                  <h2>Cosa dicono di noi</h2>
                </div>

                {reviews.length > 0 && (
                  <div className="reviews-total">
                    <Star
                      size={17}
                      fill="currentColor"
                    />

                    {reviews.length}{' '}
                    {reviews.length === 1
                      ? 'recensione'
                      : 'recensioni'}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="reviews-loading">
                  <LoaderCircle
                    size={28}
                    className="reviews-spinner"
                  />

                  Caricamento recensioni...
                </div>
              ) : reviews.length === 0 ? (
                <div className="reviews-empty">
                  <Star size={36} />

                  <h3>
                    Ancora nessuna recensione
                  </h3>

                  <p>
                    Le recensioni approvate
                    compariranno qui.
                  </p>
                </div>
              ) : (
                <div className="public-reviews-list">
                  {reviews.map((review) => (
                    <article
                      className="public-review-card"
                      key={review.id}
                    >
                      <div className="review-card-top">
                        <div>
                          <div className="review-name-row">
                            <h3>
                              {review.customer_name ||
                                'Cliente'}
                            </h3>

                            {review.featured && (
                              <span className="featured-badge">
                                In evidenza
                              </span>
                            )}
                          </div>

                          <Stars
                            value={review.rating}
                          />
                        </div>

                        {review.created_at && (
                          <span className="review-date">
                            {new Intl.DateTimeFormat(
                              'it-IT',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }
                            ).format(
                              new Date(
                                review.created_at
                              )
                            )}
                          </span>
                        )}
                      </div>

                      <p>{review.comment}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <aside className="review-form-card">
              <span className="form-kicker">
                La tua esperienza
              </span>

              <h2>Lascia una recensione</h2>

              <p className="form-intro">
                Hai acquistato una creazione?
                Raccontaci la tua esperienza.
              </p>

              {success && (
                <div className="review-alert success">
                  <CheckCircle2 size={19} />

                  <div>
                    <strong>
                      Grazie per la recensione!
                    </strong>

                    <span>
                      Verrà pubblicata dopo
                      l'approvazione.
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="review-alert error">
                  {error}
                </div>
              )}

              <form onSubmit={submitReview}>
                <label className="review-field">
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

                <label className="review-field">
                  <span>Valutazione *</span>

                  <select
                    className="input-ery"
                    value={form.rating}
                    onChange={(event) =>
                      updateField(
                        'rating',
                        event.target.value
                      )
                    }
                  >
                    <option value="5">
                      ★★★★★ — 5 stelle
                    </option>

                    <option value="4">
                      ★★★★☆ — 4 stelle
                    </option>

                    <option value="3">
                      ★★★☆☆ — 3 stelle
                    </option>

                    <option value="2">
                      ★★☆☆☆ — 2 stelle
                    </option>

                    <option value="1">
                      ★☆☆☆☆ — 1 stella
                    </option>
                  </select>
                </label>

                <label className="review-field">
                  <span>Recensione *</span>

                  <textarea
                    className="input-ery"
                    rows="6"
                    placeholder="Raccontaci cosa ti è piaciuto..."
                    value={form.comment}
                    maxLength="3000"
                    onChange={(event) =>
                      updateField(
                        'comment',
                        event.target.value
                      )
                    }
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="btn-primary review-submit"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="reviews-spinner"
                      />
                      Invio...
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      Invia recensione
                    </>
                  )}
                </button>
              </form>

              <p className="moderation-note">
                Per proteggere la community da spam
                e contenuti inappropriati, le
                recensioni vengono controllate prima
                della pubblicazione.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .public-reviews-page {
    min-height: 75vh;
    background: #fffdfb;
  }

  .public-reviews-hero {
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
    border-bottom:
      1px solid rgba(112,83,70,.08);
  }

  .reviews-kicker,
  .reviews-heading > div > span,
  .form-kicker {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .public-reviews-hero h1 {
    margin: 7px 0 14px;
    color: #443731;
    font-family:
      'Cormorant Garamond', serif;
    font-size: clamp(46px, 7vw, 68px);
    font-weight: 500;
    line-height: 1;
  }

  .public-reviews-hero p {
    max-width: 630px;
    margin: 0 auto;
    color: #7d7069;
    font-size: 13px;
    line-height: 1.8;
  }

  .public-reviews-content {
    padding: 65px 0 95px;
  }

  .reviews-layout {
    max-width: 1080px;
    margin: 0 auto;
    display: grid;
    grid-template-columns:
      minmax(0, 1.3fr)
      minmax(300px, .7fr);
    gap: 45px;
    align-items: start;
  }

  .reviews-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
  }

  .reviews-heading h2 {
    margin: 4px 0 0;
    color: #493d37;
    font-family:
      'Cormorant Garamond', serif;
    font-size: 36px;
    font-weight: 500;
  }

  .reviews-total {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #a78332;
    font-size: 10px;
  }

  .public-reviews-list {
    display: grid;
    gap: 14px;
  }

  .public-review-card {
    padding: 23px;
    border:
      1px solid rgba(112,83,70,.11);
    border-radius: 18px;
    background: white;
  }

  .review-card-top {
    display: flex;
    justify-content: space-between;
    gap: 15px;
  }

  .review-name-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
  }

  .review-name-row h3 {
    margin: 0;
    color: #4d413b;
    font-family:
      'Cormorant Garamond', serif;
    font-size: 24px;
    font-weight: 600;
  }

  .featured-badge {
    padding: 3px 7px;
    border-radius: 20px;
    background: rgba(202,164,72,.12);
    color: #9a7625;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .public-review-stars {
    display: flex;
    gap: 2px;
    margin-top: 4px;
    color: #c8a34d;
  }

  .review-date {
    color: #a0958e;
    font-size: 9px;
    white-space: nowrap;
  }

  .public-review-card > p {
    margin: 14px 0 0;
    color: #70645e;
    font-size: 11px;
    line-height: 1.8;
    white-space: pre-wrap;
  }

  .reviews-loading,
  .reviews-empty {
    padding: 55px 20px;
    text-align: center;
    color: #8a7d76;
  }

  .reviews-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .reviews-empty {
    border:
      1px dashed rgba(112,83,70,.18);
    border-radius: 18px;
  }

  .reviews-empty svg {
    color: var(--terracotta);
  }

  .reviews-empty h3 {
    margin: 10px 0 4px;
    color: #50443e;
    font-family:
      'Cormorant Garamond', serif;
    font-size: 26px;
  }

  .reviews-empty p {
    margin: 0;
    font-size: 10px;
  }

  .review-form-card {
    position: sticky;
    top: 95px;
    padding: 28px;
    border:
      1px solid rgba(112,83,70,.11);
    border-radius: 21px;
    background: white;
    box-shadow:
      0 15px 45px rgba(73,54,45,.055);
  }

  .review-form-card h2 {
    margin: 5px 0;
    color: #493d37;
    font-family:
      'Cormorant Garamond', serif;
    font-size: 31px;
    font-weight: 500;
  }

  .form-intro {
    margin: 0 0 22px;
    color: #8a7d76;
    font-size: 10px;
    line-height: 1.6;
  }

  .review-field {
    display: block;
    margin-bottom: 15px;
  }

  .review-field > span {
    display: block;
    margin-bottom: 6px;
    color: #615650;
    font-size: 10px;
    font-weight: 600;
  }

  .review-field input,
  .review-field select,
  .review-field textarea {
    width: 100%;
  }

  .review-field textarea {
    resize: vertical;
  }

  .review-submit {
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }

  .review-submit:disabled {
    opacity: .6;
    cursor: wait;
  }

  .review-alert {
    margin-bottom: 18px;
    padding: 12px 14px;
    border-radius: 11px;
    font-size: 10px;
  }

  .review-alert.success {
    display: flex;
    gap: 8px;
    background:
      rgba(99,132,92,.10);
    color: #55724f;
  }

  .review-alert.success div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .review-alert.error {
    background:
      rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .moderation-note {
    margin: 14px 0 0;
    color: #9a8f88;
    font-size: 8px;
    line-height: 1.6;
    text-align: center;
  }

  .reviews-spinner {
    animation:
      reviews-spin 1s linear infinite;
  }

  @keyframes reviews-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 850px) {
    .reviews-layout {
      grid-template-columns: 1fr;
    }

    .review-form-card {
      position: static;
    }
  }

  @media (max-width: 600px) {
    .public-reviews-hero {
      padding: 55px 0 48px;
    }

    .public-reviews-content {
      padding: 40px 0 70px;
    }

    .reviews-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .review-form-card {
      padding: 22px 18px;
    }

    .review-card-top {
      flex-direction: column;
      gap: 5px;
    }
  }
`

export default Reviews