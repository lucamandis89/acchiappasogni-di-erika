import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  LoaderCircle,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import { supabase } from '../supabaseClient'

function formatDate(value) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function Stars({ value = 0 }) {
  const rating = Math.max(
    0,
    Math.min(5, Number(value || 0))
  )

  return (
    <div className="review-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={15}
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

function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] =
    useState(null)

  const [editingReview, setEditingReview] =
    useState(null)

  const [form, setForm] = useState({
    customer_name: '',
    rating: 5,
    comment: '',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
          .select('*')
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

  function startEdit(review) {
    setEditingReview(review)

    setForm({
      customer_name:
        review.customer_name || '',
      rating: Number(review.rating || 5),
      comment: review.comment || '',
    })

    setError('')
    setSuccess('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function closeEdit() {
    setEditingReview(null)

    setForm({
      customer_name: '',
      rating: 5,
      comment: '',
    })
  }

  async function saveEdit(event) {
    event.preventDefault()

    if (!editingReview) return

    const name = form.customer_name.trim()
    const comment = form.comment.trim()
    const rating = Number(form.rating)

    if (!name) {
      setError(
        'Inserisci il nome del cliente.'
      )
      return
    }

    if (!comment) {
      setError(
        'Inserisci il testo della recensione.'
      )
      return
    }

    if (
      !Number.isFinite(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      setError(
        'La valutazione deve essere compresa tra 1 e 5.'
      )
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } =
        await supabase
          .from('reviews')
          .update({
            customer_name: name,
            rating,
            comment,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', editingReview.id)

      if (updateError) {
        throw updateError
      }

      setSuccess(
        'Recensione aggiornata correttamente.'
      )

      closeEdit()
      await loadReviews()
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Errore durante il salvataggio.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleApproved(review) {
    setError('')
    setSuccess('')

    const nextValue =
      review.approved === false

    try {
      const { error: updateError } =
        await supabase
          .from('reviews')
          .update({
            approved: nextValue,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', review.id)

      if (updateError) {
        throw updateError
      }

      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? {
                ...item,
                approved: nextValue,
              }
            : item
        )
      )

      setSuccess(
        nextValue
          ? 'Recensione approvata.'
          : 'Recensione nascosta.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile modificare la recensione.'
      )
    }
  }

  async function toggleFeatured(review) {
    setError('')
    setSuccess('')

    const nextValue =
      review.featured !== true

    try {
      const { error: updateError } =
        await supabase
          .from('reviews')
          .update({
            featured: nextValue,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', review.id)

      if (updateError) {
        throw updateError
      }

      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? {
                ...item,
                featured: nextValue,
              }
            : item
        )
      )

      setSuccess(
        nextValue
          ? 'Recensione messa in evidenza.'
          : 'Recensione rimossa dalle evidenziate.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile modificare la recensione.'
      )
    }
  }

  async function deleteReview(review) {
    const confirmed = window.confirm(
      `Vuoi eliminare la recensione di "${
        review.customer_name ||
        'questo cliente'
      }"?`
    )

    if (!confirmed) return

    setDeletingId(review.id)
    setError('')
    setSuccess('')

    try {
      const { error: deleteError } =
        await supabase
          .from('reviews')
          .delete()
          .eq('id', review.id)

      if (deleteError) {
        throw deleteError
      }

      setReviews((current) =>
        current.filter(
          (item) => item.id !== review.id
        )
      )

      setSuccess(
        'Recensione eliminata.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile eliminare la recensione.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const approvedCount =
    reviews.filter(
      (review) => review.approved !== false
    ).length

  const pendingCount =
    reviews.filter(
      (review) => review.approved === false
    ).length

  return (
    <main className="reviews-page">
      <div className="container-ery">
        <header className="reviews-header">
          <div>
            <Link
              to="/admin"
              className="reviews-back"
            >
              <ArrowLeft size={16} />
              Amministrazione
            </Link>

            <span className="reviews-kicker">
              Clienti
            </span>

            <h1>Recensioni</h1>

            <p>
              Controlla, approva e gestisci le
              recensioni ricevute.
            </p>
          </div>

          <button
            type="button"
            className="btn-outline reviews-refresh"
            onClick={loadReviews}
          >
            Aggiorna
          </button>
        </header>

        {error && (
          <div className="review-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="review-message success">
            {success}
          </div>
        )}

        {editingReview && (
          <section className="review-edit-card">
            <div className="review-edit-heading">
              <div>
                <span>Modifica</span>
                <h2>Modifica recensione</h2>
              </div>

              <button
                type="button"
                className="review-close"
                onClick={closeEdit}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="review-form"
              onSubmit={saveEdit}
            >
              <label>
                <span>Nome cliente</span>

                <input
                  className="input-ery"
                  value={form.customer_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customer_name:
                        event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                <span>Valutazione</span>

                <select
                  className="input-ery"
                  value={form.rating}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rating:
                        event.target.value,
                    }))
                  }
                >
                  <option value="5">
                    5 stelle
                  </option>
                  <option value="4">
                    4 stelle
                  </option>
                  <option value="3">
                    3 stelle
                  </option>
                  <option value="2">
                    2 stelle
                  </option>
                  <option value="1">
                    1 stella
                  </option>
                </select>
              </label>

              <label className="review-comment-field">
                <span>Recensione</span>

                <textarea
                  className="input-ery"
                  rows="5"
                  value={form.comment}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      comment:
                        event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <div className="review-form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={closeEdit}
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="review-spinner"
                      />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Salva
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="reviews-summary">
          <div className="summary-card">
            <Star size={21} />
            <div>
              <strong>
                {reviews.length}
              </strong>
              <span>Totali</span>
            </div>
          </div>

          <div className="summary-card">
            <CheckCircle2 size={21} />
            <div>
              <strong>
                {approvedCount}
              </strong>
              <span>Approvate</span>
            </div>
          </div>

          <div className="summary-card">
            <EyeOff size={21} />
            <div>
              <strong>
                {pendingCount}
              </strong>
              <span>Nascoste</span>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="reviews-loading">
            <LoaderCircle
              size={30}
              className="review-spinner"
            />
            Caricamento recensioni...
          </div>
        ) : reviews.length === 0 ? (
          <section className="reviews-empty">
            <Star size={38} />
            <h2>Nessuna recensione</h2>
            <p>
              Le recensioni dei clienti
              compariranno qui.
            </p>
          </section>
        ) : (
          <section className="reviews-list">
            {reviews.map((review) => (
              <article
                className="review-card"
                key={review.id}
              >
                <div className="review-content">
                  <div className="review-top">
                    <div>
                      <div className="review-badges">
                        <span
                          className={
                            review.approved !== false
                              ? 'approved'
                              : 'hidden'
                          }
                        >
                          {review.approved !== false
                            ? 'Approvata'
                            : 'Nascosta'}
                        </span>

                        {review.featured && (
                          <span className="featured">
                            In evidenza
                          </span>
                        )}
                      </div>

                      <h2>
                        {review.customer_name ||
                          'Cliente'}
                      </h2>

                      <Stars
                        value={review.rating}
                      />
                    </div>

                    <span className="review-date">
                      {formatDate(
                        review.created_at
                      )}
                    </span>
                  </div>

                  {review.product_name && (
                    <div className="review-product">
                      Prodotto:{' '}
                      <strong>
                        {review.product_name}
                      </strong>
                    </div>
                  )}

                  <p className="review-comment">
                    {review.comment ||
                      'Nessun commento.'}
                  </p>
                </div>

                <div className="review-actions">
                  <button
                    type="button"
                    onClick={() =>
                      toggleApproved(review)
                    }
                  >
                    {review.approved !== false ? (
                      <>
                        <EyeOff size={15} />
                        Nascondi
                      </>
                    ) : (
                      <>
                        <Eye size={15} />
                        Approva
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleFeatured(review)
                    }
                  >
                    <Star
                      size={15}
                      fill={
                        review.featured
                          ? 'currentColor'
                          : 'none'
                      }
                    />

                    {review.featured
                      ? 'Togli evidenza'
                      : 'Evidenzia'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      startEdit(review)
                    }
                  >
                    <Edit3 size={15} />
                    Modifica
                  </button>

                  <button
                    type="button"
                    className="review-delete"
                    disabled={
                      deletingId === review.id
                    }
                    onClick={() =>
                      deleteReview(review)
                    }
                  >
                    {deletingId ===
                    review.id ? (
                      <LoaderCircle
                        size={15}
                        className="review-spinner"
                      />
                    ) : (
                      <Trash2 size={15} />
                    )}

                    Elimina
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .reviews-page {
    min-height: 75vh;
    padding: 45px 0 90px;
  }

  .reviews-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 25px;
    margin-bottom: 28px;
  }

  .reviews-back {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    color: #85766f;
    font-size: 11px;
    text-decoration: none;
  }

  .reviews-kicker {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
  }

  .reviews-header h1 {
    margin: 3px 0 5px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px;
    font-weight: 500;
  }

  .reviews-header p {
    margin: 0;
    color: #877a73;
    font-size: 12px;
  }

  .reviews-refresh {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .review-message {
    margin-bottom: 18px;
    padding: 12px 15px;
    border-radius: 12px;
    font-size: 11px;
  }

  .review-message.error {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .review-message.success {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .review-edit-card {
    margin-bottom: 25px;
    padding: 25px;
    border: 1px solid rgba(112,83,70,.12);
    border-radius: 20px;
    background: white;
  }

  .review-edit-heading {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .review-edit-heading span {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .review-edit-heading h2 {
    margin: 3px 0 0;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
  }

  .review-close {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(112,83,70,.12);
    border-radius: 50%;
    background: white;
    cursor: pointer;
  }

  .review-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 17px;
  }

  .review-form label > span {
    display: block;
    margin-bottom: 7px;
    color: #625750;
    font-size: 10px;
    font-weight: 600;
  }

  .review-comment-field {
    grid-column: 1 / -1;
  }

  .review-comment-field textarea {
    width: 100%;
    resize: vertical;
  }

  .review-form-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 9px;
  }

  .review-form-actions button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .reviews-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 22px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 125px;
    padding: 12px 15px;
    border-radius: 13px;
    background: rgba(144,153,139,.10);
    color: var(--sage);
  }

  .summary-card div {
    display: flex;
    flex-direction: column;
  }

  .summary-card strong {
    color: #4f4641;
    font-size: 18px;
  }

  .summary-card span {
    color: #887d77;
    font-size: 8px;
    text-transform: uppercase;
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
    border: 1px dashed rgba(112,83,70,.18);
    border-radius: 20px;
  }

  .reviews-empty > svg {
    color: var(--terracotta);
  }

  .reviews-empty h2 {
    margin: 12px 0 5px;
    color: #50443e;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
  }

  .reviews-empty p {
    margin: 0;
    font-size: 11px;
  }

  .reviews-list {
    display: grid;
    gap: 14px;
  }

  .review-card {
    padding: 21px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 18px;
    background: white;
  }

  .review-top {
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }

  .review-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 5px;
  }

  .review-badges span {
    padding: 3px 7px;
    border-radius: 20px;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .review-badges .approved {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .review-badges .hidden {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .review-badges .featured {
    background: rgba(202,164,72,.12);
    color: #9a7625;
  }

  .review-card h2 {
    margin: 0;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
  }

  .review-stars {
    display: flex;
    gap: 2px;
    margin-top: 3px;
    color: #c8a34d;
  }

  .review-date {
    color: #a0958e;
    font-size: 9px;
  }

  .review-product {
    margin-top: 12px;
    color: #948881;
    font-size: 9px;
  }

  .review-comment {
    margin: 11px 0 0;
    color: #70645e;
    font-size: 11px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .review-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 17px;
    padding-top: 14px;
    border-top: 1px solid rgba(112,83,70,.08);
  }

  .review-actions button {
    min-height: 36px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 1px solid rgba(112,83,70,.13);
    border-radius: 9px;
    background: white;
    color: #6e6059;
    cursor: pointer;
    font-size: 9px;
  }

  .review-actions .review-delete {
    color: #a14d4d;
    border-color: rgba(175,65,65,.15);
  }

  .review-actions button:disabled {
    opacity: .55;
  }

  .review-spinner {
    animation: review-spin 1s linear infinite;
  }

  @keyframes review-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
    .reviews-header {
      align-items: stretch;
      flex-direction: column;
    }

    .reviews-refresh {
      width: 100%;
    }

    .review-form {
      grid-template-columns: 1fr;
    }

    .review-comment-field,
    .review-form-actions {
      grid-column: auto;
    }

    .review-form-actions {
      flex-direction: column-reverse;
    }

    .review-form-actions button {
      width: 100%;
    }

    .review-top {
      flex-direction: column;
      gap: 5px;
    }

    .review-actions button {
      flex: 1;
    }
  }
`

export default AdminReviews