import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit3,
  LoaderCircle,
  Plus,
  Save,
  TicketPercent,
  Trash2,
  X,
} from 'lucide-react'

import { supabase } from '../supabaseClient'

const emptyForm = {
  code: '',
  type: 'percent',
  value: '',
  start_date: '',
  end_date: '',
  min_order: '',
  max_uses: '',
  active: true,
}

function money(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return 'Nessuna'

  try {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState(emptyForm)

  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadCoupons()
  }, [])

  async function loadCoupons() {
    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } =
        await supabase
          .from('coupons')
          .select('*')
          .order('created_at', {
            ascending: false,
          })

      if (loadError) {
        throw loadError
      }

      setCoupons(data || [])
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile caricare i coupon.'
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

  function handleCodeChange(event) {
    const value = event.target.value
      .toUpperCase()
      .replace(/\s+/g, '')

    setForm((current) => ({
      ...current,
      code: value,
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

  function startEdit(coupon) {
    setEditingId(coupon.id)

    setForm({
      code: coupon.code || '',
      type: coupon.type || 'percent',
      value: coupon.value ?? '',
      start_date:
        coupon.start_date?.slice(0, 10) || '',
      end_date:
        coupon.end_date?.slice(0, 10) || '',
      min_order: coupon.min_order ?? '',
      max_uses: coupon.max_uses ?? '',
      active: coupon.active !== false,
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

    const code = form.code
      .trim()
      .toUpperCase()

    const value = Number(form.value)

    if (!code) {
      setError('Inserisci il codice coupon.')
      return
    }

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      setError(
        'Inserisci un valore sconto valido.'
      )
      return
    }

    if (
      form.type === 'percent' &&
      value > 100
    ) {
      setError(
        'Lo sconto percentuale non può superare il 100%.'
      )
      return
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError(
        'La data di scadenza non può precedere la data di inizio.'
      )
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      code,
      type: form.type,
      value,
      start_date:
        form.start_date || null,
      end_date:
        form.end_date || null,
      min_order:
        form.min_order === ''
          ? null
          : Number(form.min_order),
      max_uses:
        form.max_uses === ''
          ? null
          : Number.parseInt(
              form.max_uses,
              10
            ),
      active: Boolean(form.active),
    }

    try {
      if (editingId) {
        const { error: updateError } =
          await supabase
            .from('coupons')
            .update(payload)
            .eq('id', editingId)

        if (updateError) {
          throw updateError
        }

        setSuccess(
          'Coupon aggiornato correttamente.'
        )
      } else {
        const { error: insertError } =
          await supabase
            .from('coupons')
            .insert({
              ...payload,
              uses: 0,
            })

        if (insertError) {
          throw insertError
        }

        setSuccess(
          'Coupon creato correttamente.'
        )
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)

      await loadCoupons()
    } catch (err) {
      console.error(err)

      if (
        err?.code === '23505'
      ) {
        setError(
          'Esiste già un coupon con questo codice.'
        )
      } else {
        setError(
          err?.message ||
            'Errore durante il salvataggio.'
        )
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(coupon) {
    const confirmed = window.confirm(
      `Vuoi eliminare il coupon "${coupon.code}"?`
    )

    if (!confirmed) return

    setDeletingId(coupon.id)
    setError('')
    setSuccess('')

    try {
      const { error: deleteError } =
        await supabase
          .from('coupons')
          .delete()
          .eq('id', coupon.id)

      if (deleteError) {
        throw deleteError
      }

      setCoupons((current) =>
        current.filter(
          (item) => item.id !== coupon.id
        )
      )

      setSuccess(
        'Coupon eliminato correttamente.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile eliminare il coupon.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleActive(coupon) {
    setError('')
    setSuccess('')

    try {
      const nextActive =
        coupon.active === false

      const { error: updateError } =
        await supabase
          .from('coupons')
          .update({
            active: nextActive,
          })
          .eq('id', coupon.id)

      if (updateError) {
        throw updateError
      }

      setCoupons((current) =>
        current.map((item) =>
          item.id === coupon.id
            ? {
                ...item,
                active: nextActive,
              }
            : item
        )
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile modificare lo stato del coupon.'
      )
    }
  }

  function couponValue(coupon) {
    if (coupon.type === 'percent') {
      return `${Number(coupon.value)}%`
    }

    return money(coupon.value)
  }

  return (
    <main className="coupons-page">
      <div className="container-ery">
        <header className="coupons-header">
          <div>
            <Link
              to="/admin"
              className="coupons-back"
            >
              <ArrowLeft size={16} />
              Amministrazione
            </Link>

            <span className="coupons-kicker">
              Promozioni
            </span>

            <h1>Coupon</h1>

            <p>
              Crea e gestisci i codici sconto
              del negozio.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary coupons-new"
            onClick={startNew}
          >
            <Plus size={17} />
            Nuovo coupon
          </button>
        </header>

        {error && (
          <div className="coupon-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="coupon-message success">
            {success}
          </div>
        )}

        {showForm && (
          <section className="coupon-form-card">
            <div className="coupon-form-heading">
              <div>
                <span>
                  {editingId
                    ? 'Modifica'
                    : 'Nuovo'}
                </span>

                <h2>
                  {editingId
                    ? 'Modifica coupon'
                    : 'Crea coupon'}
                </h2>
              </div>

              <button
                type="button"
                className="coupon-close"
                onClick={closeForm}
                aria-label="Chiudi"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="coupon-form"
              onSubmit={handleSave}
            >
              <label>
                <span>Codice coupon *</span>

                <input
                  className="input-ery coupon-code-input"
                  name="code"
                  value={form.code}
                  onChange={handleCodeChange}
                  placeholder="ES. BENVENUTO10"
                  required
                />
              </label>

              <label>
                <span>Tipo di sconto *</span>

                <select
                  className="input-ery"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="percent">
                    Percentuale (%)
                  </option>

                  <option value="fixed">
                    Importo fisso (€)
                  </option>
                </select>
              </label>

              <label>
                <span>
                  {form.type === 'percent'
                    ? 'Percentuale sconto *'
                    : 'Importo sconto *'}
                </span>

                <input
                  className="input-ery"
                  type="number"
                  name="value"
                  min="0.01"
                  max={
                    form.type === 'percent'
                      ? '100'
                      : undefined
                  }
                  step="0.01"
                  value={form.value}
                  onChange={handleChange}
                  placeholder={
                    form.type === 'percent'
                      ? '10'
                      : '5.00'
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Ordine minimo (€)
                </span>

                <input
                  className="input-ery"
                  type="number"
                  name="min_order"
                  min="0"
                  step="0.01"
                  value={form.min_order}
                  onChange={handleChange}
                  placeholder="Nessun minimo"
                />
              </label>

              <label>
                <span>Data inizio</span>

                <input
                  className="input-ery"
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Data scadenza</span>

                <input
                  className="input-ery"
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>
                  Numero massimo utilizzi
                </span>

                <input
                  className="input-ery"
                  type="number"
                  name="max_uses"
                  min="1"
                  step="1"
                  value={form.max_uses}
                  onChange={handleChange}
                  placeholder="Illimitati"
                />
              </label>

              <label className="coupon-checkbox">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />

                <span>Coupon attivo</span>
              </label>

              <div className="coupon-form-actions">
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
                        className="coupon-spinner"
                      />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Salva coupon
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="coupons-summary">
          <div>
            <TicketPercent size={21} />
          </div>

          <div>
            <strong>{coupons.length}</strong>
            <span>
              {coupons.length === 1
                ? 'coupon'
                : 'coupon'}
            </span>
          </div>
        </section>

        {loading ? (
          <div className="coupons-loading">
            <LoaderCircle
              size={30}
              className="coupon-spinner"
            />
            Caricamento coupon...
          </div>
        ) : coupons.length === 0 ? (
          <section className="coupons-empty">
            <TicketPercent size={38} />

            <h2>Nessun coupon</h2>

            <p>
              Crea il primo codice sconto da
              utilizzare nel negozio.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={startNew}
            >
              <Plus size={17} />
              Nuovo coupon
            </button>
          </section>
        ) : (
          <section className="coupons-list">
            {coupons.map((coupon) => {
              const used =
                Number(coupon.uses || 0)

              const maxUses =
                coupon.max_uses == null
                  ? null
                  : Number(coupon.max_uses)

              return (
                <article
                  key={coupon.id}
                  className="coupon-card"
                >
                  <div className="coupon-main">
                    <div className="coupon-icon">
                      <TicketPercent size={24} />
                    </div>

                    <div className="coupon-info">
                      <div className="coupon-badges">
                        <span
                          className={
                            coupon.active !== false
                              ? 'active'
                              : 'inactive'
                          }
                        >
                          {coupon.active !== false
                            ? 'Attivo'
                            : 'Disattivato'}
                        </span>

                        <span>
                          {coupon.type ===
                          'percent'
                            ? 'Percentuale'
                            : 'Importo fisso'}
                        </span>
                      </div>

                      <h2>{coupon.code}</h2>

                      <div className="coupon-discount">
                        {couponValue(coupon)}
                      </div>

                      <div className="coupon-details">
                        <span>
                          Ordine minimo:{' '}
                          <strong>
                            {coupon.min_order
                              ? money(
                                  coupon.min_order
                                )
                              : 'Nessuno'}
                          </strong>
                        </span>

                        <span>
                          Inizio:{' '}
                          <strong>
                            {formatDate(
                              coupon.start_date
                            )}
                          </strong>
                        </span>

                        <span>
                          Scadenza:{' '}
                          <strong>
                            {formatDate(
                              coupon.end_date
                            )}
                          </strong>
                        </span>

                        <span>
                          Utilizzi:{' '}
                          <strong>
                            {used}
                            {maxUses !== null
                              ? ` / ${maxUses}`
                              : ' / ∞'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="coupon-actions">
                    <button
                      type="button"
                      className="coupon-status"
                      onClick={() =>
                        toggleActive(coupon)
                      }
                    >
                      {coupon.active !== false
                        ? 'Disattiva'
                        : 'Attiva'}
                    </button>

                    <button
                      type="button"
                      className="coupon-edit"
                      onClick={() =>
                        startEdit(coupon)
                      }
                    >
                      <Edit3 size={15} />
                      Modifica
                    </button>

                    <button
                      type="button"
                      className="coupon-delete"
                      onClick={() =>
                        handleDelete(coupon)
                      }
                      disabled={
                        deletingId === coupon.id
                      }
                    >
                      {deletingId ===
                      coupon.id ? (
                        <LoaderCircle
                          size={15}
                          className="coupon-spinner"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}

                      Elimina
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .coupons-page {
    min-height: 75vh;
    padding: 45px 0 90px;
  }

  .coupons-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 25px;
    margin-bottom: 28px;
  }

  .coupons-back {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    color: #85766f;
    font-size: 11px;
    text-decoration: none;
  }

  .coupons-back:hover {
    color: var(--terracotta);
  }

  .coupons-kicker {
    display: block;
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
  }

  .coupons-header h1 {
    margin: 3px 0 5px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px;
    font-weight: 500;
  }

  .coupons-header p {
    margin: 0;
    color: #877a73;
    font-size: 12px;
  }

  .coupons-new,
  .coupon-form-actions button,
  .coupons-empty button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }

  .coupon-message {
    margin-bottom: 18px;
    padding: 12px 15px;
    border-radius: 12px;
    font-size: 11px;
  }

  .coupon-message.error {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .coupon-message.success {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .coupon-form-card {
    margin-bottom: 28px;
    padding: 26px;
    border: 1px solid rgba(112,83,70,.12);
    border-radius: 20px;
    background: white;
  }

  .coupon-form-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 22px;
  }

  .coupon-form-heading span {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .coupon-form-heading h2 {
    margin: 3px 0 0;
    color: #4c403a;
    font-family: 'Cormorant Garamond', serif;
    font-size: 29px;
    font-weight: 500;
  }

  .coupon-close {
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

  .coupon-form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }

  .coupon-form label > span {
    display: block;
    margin-bottom: 7px;
    color: #625750;
    font-size: 10px;
    font-weight: 600;
  }

  .coupon-code-input {
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .coupon-checkbox {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .coupon-checkbox input {
    width: 17px;
    height: 17px;
    accent-color: var(--terracotta);
  }

  .coupon-checkbox span {
    margin: 0 !important;
  }

  .coupon-form-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 5px;
  }

  .coupons-summary {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 20px;
    padding: 12px 16px;
    border-radius: 13px;
    background: rgba(144,153,139,.10);
  }

  .coupons-summary > div:first-child {
    color: var(--sage);
  }

  .coupons-summary > div:last-child {
    display: flex;
    flex-direction: column;
  }

  .coupons-summary strong {
    color: #4f4641;
    font-size: 18px;
  }

  .coupons-summary span {
    color: #887d77;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .8px;
  }

  .coupons-loading,
  .coupons-empty {
    padding: 55px 20px;
    text-align: center;
    color: #8a7d76;
  }

  .coupons-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-size: 11px;
  }

  .coupons-empty {
    border: 1px dashed rgba(112,83,70,.18);
    border-radius: 20px;
  }

  .coupons-empty > svg {
    color: var(--terracotta);
  }

  .coupons-empty h2 {
    margin: 12px 0 5px;
    color: #50443e;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
  }

  .coupons-empty p {
    margin: 0 auto 18px;
    max-width: 420px;
    font-size: 11px;
    line-height: 1.6;
  }

  .coupons-list {
    display: grid;
    gap: 13px;
  }

  .coupon-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 19px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 17px;
    background: white;
  }

  .coupon-main {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 15px;
  }

  .coupon-icon {
    width: 54px;
    height: 54px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(224,169,155,.13);
    color: var(--terracotta);
  }

  .coupon-info {
    min-width: 0;
  }

  .coupon-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
  }

  .coupon-badges span {
    padding: 3px 7px;
    border-radius: 20px;
    background: #f5f1ee;
    color: #887a73;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .coupon-badges .active {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .coupon-badges .inactive {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .coupon-info h2 {
    margin: 0;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 25px;
  }

  .coupon-discount {
    margin-top: 2px;
    color: var(--terracotta);
    font-size: 17px;
    font-weight: 700;
  }

  .coupon-details {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 15px;
    margin-top: 9px;
  }

  .coupon-details span {
    color: #948881;
    font-size: 9px;
  }

  .coupon-details strong {
    color: #6d625c;
  }

  .coupon-actions {
    flex: 0 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .coupon-actions button {
    min-height: 38px;
    padding: 0 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border-radius: 10px;
    background: white;
    cursor: pointer;
    font-size: 9px;
    font-weight: 600;
  }

  .coupon-status,
  .coupon-edit {
    border: 1px solid rgba(112,83,70,.14);
    color: #6e6059;
  }

  .coupon-delete {
    border: 1px solid rgba(175,65,65,.15);
    color: #a14d4d;
  }

  .coupon-actions button:disabled {
    opacity: .55;
    cursor: wait;
  }

  .coupon-spinner {
    animation: coupon-spin 1s linear infinite;
  }

  @keyframes coupon-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
    .coupons-page {
      padding-top: 30px;
    }

    .coupons-header {
      align-items: stretch;
      flex-direction: column;
    }

    .coupons-new {
      width: 100%;
    }

    .coupon-form {
      grid-template-columns: 1fr;
    }

    .coupon-form-actions {
      grid-column: auto;
      flex-direction: column-reverse;
    }

    .coupon-form-actions button {
      width: 100%;
    }

    .coupon-card {
      align-items: stretch;
      flex-direction: column;
    }

    .coupon-actions {
      width: 100%;
    }

    .coupon-actions button {
      flex: 1;
    }
  }
`

export default AdminCoupons