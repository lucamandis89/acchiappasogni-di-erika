import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit3,
  Eye,
  EyeOff,
  HelpCircle,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'

import { supabase } from '../supabaseClient'

const emptyForm = {
  question: '',
  answer: '',
  category: '',
  order: 0,
  active: true,
}

function AdminFAQ() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workingId, setWorkingId] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadFaqs()
  }, [])

  async function loadFaqs() {
    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } =
        await supabase
          .from('faqs')
          .select('*')
          .order('order', { ascending: true })
          .order('created_at', { ascending: true })

      if (loadError) {
        throw loadError
      }

      setFaqs(data || [])
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile caricare le FAQ.'
      )
    } finally {
      setLoading(false)
    }
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function startEdit(faq) {
    setEditingId(faq.id)

    setForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || '',
      order: Number(faq.order || 0),
      active: faq.active !== false,
    })

    setError('')
    setSuccess('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveFaq(event) {
    event.preventDefault()

    if (!form.question.trim()) {
      setError('Inserisci la domanda.')
      return
    }

    if (!form.answer.trim()) {
      setError('Inserisci la risposta.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category.trim() || null,
      order: Number(form.order || 0),
      active: Boolean(form.active),
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingId) {
        const { error: updateError } =
          await supabase
            .from('faqs')
            .update(payload)
            .eq('id', editingId)

        if (updateError) {
          throw updateError
        }

        setSuccess('FAQ modificata correttamente.')
      } else {
        const { error: insertError } =
          await supabase
            .from('faqs')
            .insert(payload)

        if (insertError) {
          throw insertError
        }

        setSuccess('FAQ pubblicata correttamente.')
      }

      closeForm()
      await loadFaqs()
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile salvare la FAQ.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(faq) {
    setWorkingId(faq.id)
    setError('')
    setSuccess('')

    try {
      const nextValue = !faq.active

      const { error: updateError } =
        await supabase
          .from('faqs')
          .update({
            active: nextValue,
            updated_at: new Date().toISOString(),
          })
          .eq('id', faq.id)

      if (updateError) {
        throw updateError
      }

      setFaqs((current) =>
        current.map((item) =>
          item.id === faq.id
            ? {
                ...item,
                active: nextValue,
              }
            : item
        )
      )

      setSuccess(
        nextValue
          ? 'FAQ pubblicata.'
          : 'FAQ nascosta.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile aggiornare la FAQ.'
      )
    } finally {
      setWorkingId(null)
    }
  }

  async function deleteFaq(faq) {
    const confirmed = window.confirm(
      `Vuoi eliminare la FAQ "${faq.question}"?`
    )

    if (!confirmed) return

    setWorkingId(faq.id)
    setError('')
    setSuccess('')

    try {
      const { error: deleteError } =
        await supabase
          .from('faqs')
          .delete()
          .eq('id', faq.id)

      if (deleteError) {
        throw deleteError
      }

      setFaqs((current) =>
        current.filter(
          (item) => item.id !== faq.id
        )
      )

      setSuccess('FAQ eliminata.')
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile eliminare la FAQ.'
      )
    } finally {
      setWorkingId(null)
    }
  }

  const activeCount = faqs.filter(
    (faq) => faq.active
  ).length

  const hiddenCount =
    faqs.length - activeCount

  return (
    <main className="faq-admin-page">
      <div className="container-ery">
        <header className="faq-admin-header">
          <div>
            <Link
              to="/admin"
              className="faq-admin-back"
            >
              <ArrowLeft size={16} />
              Amministrazione
            </Link>

            <span className="faq-admin-kicker">
              Contenuti
            </span>

            <h1>FAQ</h1>

            <p>
              Gestisci le domande frequenti
              mostrate ai clienti.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary faq-new-button"
            onClick={startNew}
          >
            <Plus size={16} />
            Nuova FAQ
          </button>
        </header>

        {error && (
          <div className="faq-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="faq-alert success">
            {success}
          </div>
        )}

        {showForm && (
          <section className="faq-form-card">
            <div className="faq-form-header">
              <div>
                <span>
                  {editingId
                    ? 'Modifica'
                    : 'Nuova'}
                </span>

                <h2>
                  {editingId
                    ? 'Modifica FAQ'
                    : 'Crea una FAQ'}
                </h2>
              </div>

              <button
                type="button"
                className="faq-close-button"
                onClick={closeForm}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveFaq}>
              <label className="faq-field">
                <span>Domanda *</span>

                <input
                  type="text"
                  className="input-ery"
                  value={form.question}
                  onChange={(event) =>
                    updateField(
                      'question',
                      event.target.value
                    )
                  }
                  placeholder="Es. Posso personalizzare un acchiappasogni?"
                  required
                />
              </label>

              <label className="faq-field">
                <span>Risposta *</span>

                <textarea
                  className="input-ery"
                  rows="6"
                  value={form.answer}
                  onChange={(event) =>
                    updateField(
                      'answer',
                      event.target.value
                    )
                  }
                  placeholder="Scrivi qui la risposta..."
                  required
                />
              </label>

              <div className="faq-form-grid">
                <label className="faq-field">
                  <span>Categoria</span>

                  <input
                    type="text"
                    className="input-ery"
                    value={form.category}
                    onChange={(event) =>
                      updateField(
                        'category',
                        event.target.value
                      )
                    }
                    placeholder="Es. Ordini"
                  />
                </label>

                <label className="faq-field">
                  <span>Ordine</span>

                  <input
                    type="number"
                    className="input-ery"
                    min="0"
                    value={form.order}
                    onChange={(event) =>
                      updateField(
                        'order',
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              <label className="faq-checkbox">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateField(
                      'active',
                      event.target.checked
                    )
                  }
                />

                <span>
                  Pubblica questa FAQ sul sito
                </span>
              </label>

              <div className="faq-form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={closeForm}
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
                        size={16}
                        className="faq-spinner"
                      />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingId
                        ? 'Salva modifiche'
                        : 'Salva e pubblica'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="faq-summary">
          <div>
            <HelpCircle size={20} />

            <span>
              <strong>{faqs.length}</strong>
              Totali
            </span>
          </div>

          <div>
            <Eye size={20} />

            <span>
              <strong>{activeCount}</strong>
              Pubblicate
            </span>
          </div>

          <div>
            <EyeOff size={20} />

            <span>
              <strong>{hiddenCount}</strong>
              Nascoste
            </span>
          </div>
        </section>

        {loading ? (
          <div className="faq-loading">
            <LoaderCircle
              size={30}
              className="faq-spinner"
            />
            Caricamento FAQ...
          </div>
        ) : faqs.length === 0 ? (
          <section className="faq-empty">
            <HelpCircle size={40} />

            <h2>Nessuna FAQ</h2>

            <p>
              Crea la prima domanda frequente
              del negozio.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={startNew}
            >
              <Plus size={16} />
              Crea la prima FAQ
            </button>
          </section>
        ) : (
          <section className="faq-list">
            {faqs.map((faq) => (
              <article
                key={faq.id}
                className="faq-card"
              >
                <div className="faq-card-main">
                  <div className="faq-card-top">
                    <div className="faq-badges">
                      <span
                        className={
                          faq.active
                            ? 'faq-status active'
                            : 'faq-status hidden'
                        }
                      >
                        {faq.active
                          ? 'Pubblicata'
                          : 'Nascosta'}
                      </span>

                      {faq.category && (
                        <span className="faq-category">
                          {faq.category}
                        </span>
                      )}

                      <span className="faq-order">
                        Ordine {faq.order || 0}
                      </span>
                    </div>

                    <HelpCircle size={19} />
                  </div>

                  <h2>{faq.question}</h2>

                  <p>{faq.answer}</p>
                </div>

                <div className="faq-actions">
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(faq)
                    }
                  >
                    <Edit3 size={15} />
                    Modifica
                  </button>

                  <button
                    type="button"
                    disabled={
                      workingId === faq.id
                    }
                    onClick={() =>
                      toggleActive(faq)
                    }
                  >
                    {faq.active ? (
                      <>
                        <EyeOff size={15} />
                        Nascondi
                      </>
                    ) : (
                      <>
                        <Eye size={15} />
                        Pubblica
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="faq-delete"
                    disabled={
                      workingId === faq.id
                    }
                    onClick={() =>
                      deleteFaq(faq)
                    }
                  >
                    {workingId === faq.id ? (
                      <LoaderCircle
                        size={15}
                        className="faq-spinner"
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
  .faq-admin-page {
    min-height: 75vh;
    padding: 45px 0 90px;
  }

  .faq-admin-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 25px;
    margin-bottom: 28px;
  }

  .faq-admin-back {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    color: #85766f;
    font-size: 11px;
    text-decoration: none;
  }

  .faq-admin-kicker {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
  }

  .faq-admin-header h1 {
    margin: 3px 0 5px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px;
    font-weight: 500;
  }

  .faq-admin-header p {
    margin: 0;
    color: #877a73;
    font-size: 12px;
  }

  .faq-new-button,
  .faq-form-actions button,
  .faq-empty button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .faq-alert {
    margin-bottom: 18px;
    padding: 12px 15px;
    border-radius: 12px;
    font-size: 11px;
  }

  .faq-alert.error {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .faq-alert.success {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .faq-form-card {
    margin-bottom: 25px;
    padding: 25px;
    border: 1px solid rgba(112,83,70,.12);
    border-radius: 20px;
    background: white;
    box-shadow: 0 10px 35px rgba(73,54,45,.05);
  }

  .faq-form-header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
  }

  .faq-form-header span {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .faq-form-header h2 {
    margin: 3px 0 0;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px;
  }

  .faq-close-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(112,83,70,.12);
    border-radius: 50%;
    background: white;
    color: #766961;
    cursor: pointer;
  }

  .faq-field {
    display: block;
    margin-bottom: 17px;
  }

  .faq-field > span {
    display: block;
    margin-bottom: 7px;
    color: #615650;
    font-size: 10px;
    font-weight: 600;
  }

  .faq-field textarea {
    width: 100%;
    resize: vertical;
  }

  .faq-form-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 15px;
  }

  .faq-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 3px 0 22px;
    color: #665a54;
    font-size: 10px;
  }

  .faq-checkbox input {
    width: 16px;
    height: 16px;
  }

  .faq-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
  }

  .faq-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 22px;
  }

  .faq-summary > div {
    min-width: 125px;
    padding: 12px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 13px;
    background: rgba(144,153,139,.10);
    color: var(--sage);
  }

  .faq-summary span {
    display: flex;
    flex-direction: column;
    color: #887d77;
    font-size: 8px;
    text-transform: uppercase;
  }

  .faq-summary strong {
    color: #4f4641;
    font-size: 18px;
  }

  .faq-loading,
  .faq-empty {
    padding: 55px 20px;
    text-align: center;
    color: #8a7d76;
  }

  .faq-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .faq-empty {
    border: 1px dashed rgba(112,83,70,.18);
    border-radius: 20px;
  }

  .faq-empty h2 {
    margin: 12px 0 5px;
    color: #50443e;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
  }

  .faq-empty p {
    margin: 0 0 18px;
    font-size: 11px;
  }

  .faq-list {
    display: grid;
    gap: 13px;
  }

  .faq-card {
    padding: 21px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 18px;
    background: white;
  }

  .faq-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
    color: var(--terracotta);
  }

  .faq-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .faq-badges span {
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 8px;
    font-weight: 700;
  }

  .faq-status.active {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .faq-status.hidden {
    background: rgba(130,120,115,.10);
    color: #776d68;
  }

  .faq-category {
    background: rgba(224,169,155,.13);
    color: var(--terracotta);
  }

  .faq-order {
    background: rgba(144,153,139,.10);
    color: #697267;
  }

  .faq-card h2 {
    margin: 13px 0 8px;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
  }

  .faq-card p {
    margin: 0;
    color: #776b65;
    font-size: 11px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .faq-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 17px;
    padding-top: 14px;
    border-top: 1px solid rgba(112,83,70,.08);
  }

  .faq-actions button {
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

  .faq-delete {
    color: #a14d4d !important;
    border-color: rgba(175,65,65,.15) !important;
  }

  .faq-spinner {
    animation: faq-spin 1s linear infinite;
  }

  @keyframes faq-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
    .faq-admin-header {
      align-items: stretch;
      flex-direction: column;
    }

    .faq-new-button {
      width: 100%;
    }

    .faq-form-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .faq-form-actions {
      flex-direction: column-reverse;
    }

    .faq-form-actions button {
      width: 100%;
    }

    .faq-actions button {
      flex: 1;
    }
  }
`

export default AdminFAQ