import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit3,
  LoaderCircle,
  Plus,
  Save,
  Tags,
  Trash2,
  X,
} from 'lucide-react'

import { supabase } from '../supabaseClient'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  active: true,
  order: 0,
}

function makeSlug(value = '') {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)

  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } =
        await supabase
          .from('categories')
          .select('*')
          .order('order', { ascending: true })
          .order('name', { ascending: true })

      if (loadError) {
        throw loadError
      }

      setCategories(data || [])
    } catch (err) {
      console.error(err)
      setError(
        err?.message ||
          'Impossibile caricare le categorie.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  function handleNameChange(event) {
    const value = event.target.value

    setForm((current) => ({
      ...current,
      name: value,
      slug:
        editingId && current.slug
          ? current.slug
          : makeSlug(value),
    }))
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function startEdit(category) {
    setEditingId(category.id)

    setForm({
      name: category.name || '',
      slug:
        category.slug ||
        makeSlug(category.name || ''),
      description:
        category.description || '',
      image: category.image || '',
      active: category.active !== false,
      order: category.order ?? 0,
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
    setError('')
  }

  async function handleSave(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError(
        'Inserisci il nome della categoria.'
      )
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      name: form.name.trim(),
      slug:
        makeSlug(form.slug) ||
        makeSlug(form.name),
      description:
        form.description.trim() || null,
      image:
        form.image.trim() || null,
      active: Boolean(form.active),
      order:
        Number.parseInt(form.order, 10) || 0,
    }

    try {
      if (editingId) {
        const { error: updateError } =
          await supabase
            .from('categories')
            .update(payload)
            .eq('id', editingId)

        if (updateError) {
          throw updateError
        }

        setSuccess(
          'Categoria aggiornata correttamente.'
        )
      } else {
        const { error: insertError } =
          await supabase
            .from('categories')
            .insert(payload)

        if (insertError) {
          throw insertError
        }

        setSuccess(
          'Categoria creata correttamente.'
        )
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)

      await loadCategories()
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

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Vuoi eliminare la categoria "${category.name}"?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(category.id)
    setError('')
    setSuccess('')

    try {
      const { error: deleteError } =
        await supabase
          .from('categories')
          .delete()
          .eq('id', category.id)

      if (deleteError) {
        throw deleteError
      }

      setCategories((current) =>
        current.filter(
          (item) => item.id !== category.id
        )
      )

      setSuccess(
        'Categoria eliminata correttamente.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile eliminare la categoria.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="categories-page">
      <div className="container-ery">
        <header className="categories-header">
          <div>
            <Link
              to="/admin"
              className="categories-back"
            >
              <ArrowLeft size={16} />
              Amministrazione
            </Link>

            <span className="categories-kicker">
              Catalogo
            </span>

            <h1>Categorie</h1>

            <p>
              Organizza gli acchiappasogni
              nelle categorie del negozio.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary categories-new"
            onClick={startNew}
          >
            <Plus size={17} />
            Nuova categoria
          </button>
        </header>

        {error && (
          <div className="categories-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="categories-message success">
            {success}
          </div>
        )}

        {showForm && (
          <section className="category-form-card">
            <div className="category-form-heading">
              <div>
                <span>
                  {editingId
                    ? 'Modifica'
                    : 'Nuova'}
                </span>

                <h2>
                  {editingId
                    ? 'Modifica categoria'
                    : 'Crea categoria'}
                </h2>
              </div>

              <button
                type="button"
                className="category-close"
                onClick={closeForm}
                aria-label="Chiudi"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="category-form"
              onSubmit={handleSave}
            >
              <label>
                <span>Nome categoria *</span>

                <input
                  className="input-ery"
                  name="name"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="Es. Acchiappasogni classici"
                  required
                />
              </label>

              <label>
                <span>Slug</span>

                <input
                  className="input-ery"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="acchiappasogni-classici"
                />
              </label>

              <label className="category-full">
                <span>Descrizione</span>

                <textarea
                  className="input-ery category-textarea"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descrizione della categoria..."
                />
              </label>

              <label className="category-full">
                <span>
                  URL immagine categoria
                </span>

                <input
                  className="input-ery"
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </label>

              <label>
                <span>Ordine visualizzazione</span>

                <input
                  className="input-ery"
                  type="number"
                  name="order"
                  min="0"
                  step="1"
                  value={form.order}
                  onChange={handleChange}
                />
              </label>

              <label className="category-checkbox">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />

                <span>Categoria attiva</span>
              </label>

              <div className="category-form-actions">
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
                        size={17}
                        className="category-spinner"
                      />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Salva categoria
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="categories-summary">
          <div className="categories-summary-icon">
            <Tags size={22} />
          </div>

          <div>
            <strong>
              {categories.length}
            </strong>

            <span>
              {categories.length === 1
                ? 'categoria'
                : 'categorie'}
            </span>
          </div>
        </section>

        {loading ? (
          <div className="categories-loading">
            <LoaderCircle
              size={30}
              className="category-spinner"
            />
            Caricamento categorie...
          </div>
        ) : categories.length === 0 ? (
          <section className="categories-empty">
            <Tags size={35} />

            <h2>Nessuna categoria</h2>

            <p>
              Crea la prima categoria per
              organizzare i prodotti del negozio.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={startNew}
            >
              <Plus size={17} />
              Nuova categoria
            </button>
          </section>
        ) : (
          <section className="categories-list">
            {categories.map((category) => (
              <article
                key={category.id}
                className="category-card"
              >
                <div className="category-card-main">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="category-image"
                    />
                  ) : (
                    <div className="category-image-placeholder">
                      <Tags size={23} />
                    </div>
                  )}

                  <div className="category-info">
                    <div className="category-badges">
                      <span>
                        Ordine{' '}
                        {category.order ?? 0}
                      </span>

                      <span
                        className={
                          category.active !== false
                            ? 'active'
                            : 'inactive'
                        }
                      >
                        {category.active !== false
                          ? 'Attiva'
                          : 'Disattivata'}
                      </span>
                    </div>

                    <h2>
                      {category.name}
                    </h2>

                    {category.slug && (
                      <small>
                        /{category.slug}
                      </small>
                    )}

                    {category.description && (
                      <p>
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="category-actions">
                  <button
                    type="button"
                    className="category-edit"
                    onClick={() =>
                      startEdit(category)
                    }
                  >
                    <Edit3 size={15} />
                    Modifica
                  </button>

                  <button
                    type="button"
                    className="category-delete"
                    onClick={() =>
                      handleDelete(category)
                    }
                    disabled={
                      deletingId === category.id
                    }
                  >
                    {deletingId ===
                    category.id ? (
                      <LoaderCircle
                        size={15}
                        className="category-spinner"
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
  .categories-page {
    min-height: 75vh;
    padding: 45px 0 90px;
  }

  .categories-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 25px;
    margin-bottom: 28px;
  }

  .categories-back {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    color: #85766f;
    font-size: 11px;
    text-decoration: none;
  }

  .categories-back:hover {
    color: var(--terracotta);
  }

  .categories-kicker {
    display: block;
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
  }

  .categories-header h1 {
    margin: 3px 0 5px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px;
    font-weight: 500;
  }

  .categories-header p {
    margin: 0;
    color: #877a73;
    font-size: 12px;
  }

  .categories-new,
  .category-form-actions button,
  .categories-empty button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }

  .categories-message {
    margin-bottom: 18px;
    padding: 12px 15px;
    border-radius: 12px;
    font-size: 11px;
  }

  .categories-message.error {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .categories-message.success {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .category-form-card {
    margin-bottom: 28px;
    padding: 26px;
    border: 1px solid rgba(112,83,70,.12);
    border-radius: 20px;
    background: white;
  }

  .category-form-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
  }

  .category-form-heading span {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .category-form-heading h2 {
    margin: 3px 0 0;
    color: #4c403a;
    font-family: 'Cormorant Garamond', serif;
    font-size: 29px;
    font-weight: 500;
  }

  .category-close {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(112,83,70,.12);
    border-radius: 50%;
    background: white;
    color: #74665f;
    cursor: pointer;
  }

  .category-form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }

  .category-form label > span {
    display: block;
    margin-bottom: 7px;
    color: #625750;
    font-size: 10px;
    font-weight: 600;
  }

  .category-full {
    grid-column: 1 / -1;
  }

  .category-textarea {
    min-height: 100px;
    resize: vertical;
  }

  .category-checkbox {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .category-checkbox input {
    width: 17px;
    height: 17px;
    accent-color: var(--terracotta);
  }

  .category-checkbox span {
    margin: 0 !important;
  }

  .category-form-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 5px;
  }

  .categories-summary {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 20px;
    padding: 12px 16px;
    border-radius: 13px;
    background: rgba(144,153,139,.10);
  }

  .categories-summary-icon {
    color: var(--sage);
  }

  .categories-summary div:last-child {
    display: flex;
    flex-direction: column;
  }

  .categories-summary strong {
    color: #4f4641;
    font-size: 18px;
  }

  .categories-summary span {
    color: #887d77;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .8px;
  }

  .categories-loading,
  .categories-empty {
    padding: 55px 20px;
    text-align: center;
    color: #8a7d76;
  }

  .categories-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-size: 11px;
  }

  .categories-empty {
    border: 1px dashed rgba(112,83,70,.18);
    border-radius: 20px;
  }

  .categories-empty > svg {
    color: var(--terracotta);
    opacity: .7;
  }

  .categories-empty h2 {
    margin: 12px 0 5px;
    color: #50443e;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
  }

  .categories-empty p {
    margin: 0 auto 18px;
    max-width: 420px;
    font-size: 11px;
    line-height: 1.6;
  }

  .categories-list {
    display: grid;
    gap: 13px;
  }

  .category-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 18px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 17px;
    background: white;
  }

  .category-card-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .category-image,
  .category-image-placeholder {
    width: 72px;
    height: 72px;
    flex: 0 0 auto;
    border-radius: 13px;
  }

  .category-image {
    object-fit: cover;
  }

  .category-image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(224,169,155,.12);
    color: var(--terracotta);
  }

  .category-info {
    min-width: 0;
  }

  .category-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
  }

  .category-badges span {
    padding: 3px 7px;
    border-radius: 20px;
    background: #f5f1ee;
    color: #887a73;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .category-badges .active {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .category-badges .inactive {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .category-info h2 {
    margin: 0;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
    font-weight: 500;
  }

  .category-info small {
    display: block;
    margin-top: 1px;
    color: #a0958f;
    font-size: 9px;
  }

  .category-info p {
    margin: 6px 0 0;
    max-width: 620px;
    color: #897d76;
    font-size: 10px;
    line-height: 1.5;
  }

  .category-actions {
    flex: 0 0 auto;
    display: flex;
    gap: 8px;
  }

  .category-actions button {
    min-height: 38px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 10px;
    background: white;
    cursor: pointer;
    font-size: 9px;
    font-weight: 600;
  }

  .category-edit {
    border: 1px solid rgba(112,83,70,.14);
    color: #6e6059;
  }

  .category-delete {
    border: 1px solid rgba(175,65,65,.15);
    color: #a14d4d;
  }

  .category-actions button:disabled {
    opacity: .55;
    cursor: wait;
  }

  .category-spinner {
    animation: category-spin 1s linear infinite;
  }

  @keyframes category-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
    .categories-page {
      padding-top: 30px;
    }

    .categories-header {
      align-items: stretch;
      flex-direction: column;
    }

    .categories-new {
      width: 100%;
    }

    .category-form {
      grid-template-columns: 1fr;
    }

    .category-full,
    .category-form-actions {
      grid-column: auto;
    }

    .category-form-actions {
      flex-direction: column-reverse;
    }

    .category-form-actions button {
      width: 100%;
    }

    .category-card {
      align-items: stretch;
      flex-direction: column;
    }

    .category-card-main {
      align-items: flex-start;
    }

    .category-actions {
      width: 100%;
    }

    .category-actions button {
      flex: 1;
    }
  }
`

export default AdminCategories