import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { meta } from '../configurator/engine'

const EMPTY_FORM = {
  name: '',
  type: 'frame',
  metadata: {},
  image: '',
  price_modifier: '0',
  active: true,
  order: '0',
}

const TYPE_OPTIONS = [
  { value: 'frame', label: 'Forme' },
  { value: 'weave', label: 'Intrecci' },
  { value: 'feather', label: 'Piume' },
  { value: 'bead', label: 'Perle' },
  { value: 'flower', label: 'Fiori' },
  { value: 'decoration', label: 'Decorazioni' },
  { value: 'charm', label: 'Ciondoli' },
]

function AdminConfigurator() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const typeOptions=[...TYPE_OPTIONS,...[...new Set(assets.map(a=>a.type))].filter(t=>!TYPE_OPTIONS.some(o=>o.value===t)).map(t=>({value:t,label:t}))]
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    loadAssets()
  }, [])

  async function loadAssets() {
    setLoading(true)
    setError('')

    const { data, error: loadError } = await supabase
      .from('configurator_assets')
      .select('*')
      .order('type', { ascending: true })
      .order('order', { ascending: true })
      .order('created_at', { ascending: false })

    if (loadError) {
      console.error(loadError)
      setError(`Errore nel caricamento: ${loadError.message}`)
      setAssets([])
    } else {
      setAssets(data || [])
    }

    setLoading(false)
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setSuccess('')
  }

  function startEdit(asset) {
    setEditingId(asset.id)
    setForm({
      name: asset.name || '',
      type: asset.type || 'frame',
      metadata: meta(asset),
      image: asset.image || meta(asset).photo_url || '',
      price_modifier: String(asset.price_modifier ?? 0),
      active: asset.active !== false,
      order: String(asset.order ?? 0),
    })

    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Puoi caricare solamente immagini.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("L'immagine è troppo grande. Dimensione massima: 8 MB.")
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg'
      const fileName = `configurator/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      if (!data?.publicUrl) {
        throw new Error("Impossibile ottenere l'indirizzo dell'immagine.")
      }

      setForm((current) => ({
        ...current,
        image: data.publicUrl,
      }))

      setSuccess('Immagine caricata.')
    } catch (uploadError) {
      console.error(uploadError)
      setError(`Errore caricamento immagine: ${uploadError.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function saveAsset(event) {
    event.preventDefault()

    const name = form.name.trim()
    const type = form.type.trim()
    const priceModifier = Number(form.price_modifier || 0)
    const order = parseInt(form.order || '0', 10)

    if (name.length < 2) {
      setError('Inserisci un nome di almeno 2 caratteri.')
      return
    }

    if (!type) {
      setError('Seleziona il tipo.')
      return
    }

    if (!Number.isFinite(priceModifier)) {
      setError('Il supplemento prezzo non è valido.')
      return
    }

    if (!Number.isInteger(order)) {
      setError("L'ordine deve essere un numero intero.")
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      name,
      type,
      image: form.image.trim() || null,
      price_modifier: priceModifier,
      active: Boolean(form.active),
      order,
      metadata: {
        ...(form.metadata || {}),
        photo_url: form.image.trim() || null,
      },
      updated_at: new Date().toISOString(),
    }

    let result

    if (editingId) {
      result = await supabase
        .from('configurator_assets')
        .update(payload)
        .eq('id', editingId)
    } else {
      result = await supabase
        .from('configurator_assets')
        .insert(payload)
    }

    if (result.error) {
      console.error(result.error)
      setError(`Errore durante il salvataggio: ${result.error.message}`)
      setSaving(false)
      return
    }

    setSuccess(editingId ? 'Elemento aggiornato.' : 'Elemento creato.')
    setForm(EMPTY_FORM)
    setEditingId(null)
    setSaving(false)
    await loadAssets()
  }

  async function toggleActive(asset) {
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('configurator_assets')
      .update({
        active: !asset.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', asset.id)

    if (updateError) {
      setError(`Errore: ${updateError.message}`)
      return
    }

    await loadAssets()
  }

  async function deleteAsset(asset) {
    const confirmed = window.confirm(
      `Vuoi eliminare definitivamente "${asset.name}"?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    const { error: deleteError } = await supabase
      .from('configurator_assets')
      .delete()
      .eq('id', asset.id)

    if (deleteError) {
      setError(`Errore durante l'eliminazione: ${deleteError.message}`)
      return
    }

    if (editingId === asset.id) {
      resetForm()
    }

    setSuccess('Elemento eliminato.')
    await loadAssets()
  }

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase()

    return assets.filter((asset) => {
      const matchesType =
        typeFilter === 'all' || asset.type === typeFilter

      const matchesSearch =
        !query ||
        asset.name?.toLowerCase().includes(query) ||
        asset.type?.toLowerCase().includes(query)

      return matchesType && matchesSearch
    })
  }, [assets, search, typeFilter])

  const counts = useMemo(() => {
    return {
      total: assets.length,
      active: assets.filter((item) => item.active).length,
      inactive: assets.filter((item) => !item.active).length,
    }
  }, [assets])

  function typeLabel(type) {
    return TYPE_OPTIONS.find((item) => item.value === type)?.label || type
  }

  function formatPrice(value) {
    const number = Number(value || 0)

    if (number === 0) return 'Nessun supplemento'

    return `${number > 0 ? '+' : ''}${number.toLocaleString('it-IT', {
      style: 'currency',
      currency: 'EUR',
    })}`
  }

  return (
    <main className="admin-configurator-page">
      <div className="admin-configurator-container">
        <div className="top-row">
          <Link to="/admin" className="back-link">
            <ArrowLeft size={18} />
            Torna al pannello Admin
          </Link>
        </div>

        <section className="page-heading">
          <div>
            <span className="eyebrow">PANNELLO ADMIN</span>
            <h1>Configuratore</h1>
            <p>
              Gestisci tutte le opzioni che i clienti potranno scegliere
              quando creano il loro acchiappasogni.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={resetForm}
          >
            <Plus size={18} />
            Nuovo elemento
          </button>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <strong>{counts.total}</strong>
            <span>Elementi totali</span>
          </article>

          <article className="stat-card">
            <strong>{counts.active}</strong>
            <span>Attivi</span>
          </article>

          <article className="stat-card">
            <strong>{counts.inactive}</strong>
            <span>Disattivati</span>
          </article>
        </section>

        {(error || success) && (
          <div className={error ? 'notice error' : 'notice success'}>
            {error || success}
          </div>
        )}

        <section className="editor-card">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">
                {editingId ? 'MODIFICA' : 'NUOVO ELEMENTO'}
              </span>
              <h2>
                {editingId
                  ? 'Modifica opzione'
                  : 'Aggiungi una scelta al configuratore'}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                className="icon-button"
                onClick={resetForm}
                title="Annulla modifica"
              >
                <X size={20} />
              </button>
            )}
          </div>



          <form onSubmit={saveAsset} className="asset-form">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Nome *</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Es. Luna grande"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="type">Tipo *</label>
                <input id="type" name="type" list="asset-types" value={form.type} onChange={handleChange} required />
                <datalist id="asset-types">{typeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</datalist>
                <small>Scegli un tipo esistente oppure scrivi un nuovo tipo.</small>
              </div>

              <div className="field">
                <label htmlFor="price_modifier">
                  Supplemento prezzo (€)
                </label>
                <input
                  id="price_modifier"
                  name="price_modifier"
                  type="number"
                  step="0.01"
                  value={form.price_modifier}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="field">
                <label htmlFor="order">Ordine visualizzazione</label>
                <input
                  id="order"
                  name="order"
                  type="number"
                  step="1"
                  value={form.order}
                  onChange={handleChange}
                />
              </div>
            </div>

<details><summary>Metadati opzionali per riconoscere la tua idea</summary><p>Gli elenchi possono essere separati da virgole. Bastano nome e parole chiave; gli altri campi sono opzionali.</p><div className="form-grid"><div className="field"><label htmlFor="meta-keywords">Parole chiave</label><input id="meta-keywords" value={Array.isArray(form.metadata.keywords)?form.metadata.keywords.join(', '):form.metadata.keywords||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,keywords:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-synonyms">Sinonimi</label><input id="meta-synonyms" value={Array.isArray(form.metadata.synonyms)?form.metadata.synonyms.join(', '):form.metadata.synonyms||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,synonyms:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-color">Colore</label><input id="meta-color" value={Array.isArray(form.metadata.color)?form.metadata.color.join(', '):form.metadata.color||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,color:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-secondary_colors">Colori secondari</label><input id="meta-secondary_colors" value={Array.isArray(form.metadata.secondary_colors)?form.metadata.secondary_colors.join(', '):form.metadata.secondary_colors||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,secondary_colors:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-material">Materiale</label><input id="meta-material" value={Array.isArray(form.metadata.material)?form.metadata.material.join(', '):form.metadata.material||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,material:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-size">Misura</label><input id="meta-size" value={Array.isArray(form.metadata.size)?form.metadata.size.join(', '):form.metadata.size||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,size:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-diameter_cm">Diametro (cm)</label><input id="meta-diameter_cm" value={Array.isArray(form.metadata.diameter_cm)?form.metadata.diameter_cm.join(', '):form.metadata.diameter_cm||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,diameter_cm:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-relative_size">Dimensione relativa</label><input id="meta-relative_size" value={Array.isArray(form.metadata.relative_size)?form.metadata.relative_size.join(', '):form.metadata.relative_size||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,relative_size:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-semantic_role">Ruolo (frame, weave, feather, bead, decoration…)</label><input id="meta-semantic_role" value={Array.isArray(form.metadata.semantic_role)?form.metadata.semantic_role.join(', '):form.metadata.semantic_role||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,semantic_role:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-recommended_position">Posizione (sotto, sopra, lati, centro…)</label><input id="meta-recommended_position" value={Array.isArray(form.metadata.recommended_position)?form.metadata.recommended_position.join(', '):form.metadata.recommended_position||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,recommended_position:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-compatible">Compatibilità</label><input id="meta-compatible" value={Array.isArray(form.metadata.compatible)?form.metadata.compatible.join(', '):form.metadata.compatible||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,compatible:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-incompatible">Incompatibilità</label><input id="meta-incompatible" value={Array.isArray(form.metadata.incompatible)?form.metadata.incompatible.join(', '):form.metadata.incompatible||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,incompatible:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-themes">Temi</label><input id="meta-themes" value={Array.isArray(form.metadata.themes)?form.metadata.themes.join(', '):form.metadata.themes||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,themes:e.target.value}}))} /></div><div className="field"><label htmlFor="meta-tags">Tag / significati</label><input id="meta-tags" value={Array.isArray(form.metadata.tags)?form.metadata.tags.join(', '):form.metadata.tags||''} onChange={e=>setForm(f=>({...f,metadata:{...f.metadata,tags:e.target.value}}))} /></div></div></details>
            <div className="image-section">
              <div className="field image-field">
                <label>Immagine</label>

                <label className="upload-button">
                  {uploading ? (
                    <Loader2 size={19} className="spin" />
                  ) : (
                    <ImagePlus size={19} />
                  )}

                  {uploading ? 'Caricamento...' : 'Carica foto'}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadImage}
                    disabled={uploading}
                    hidden
                  />
                </label>

                <small>
                  Puoi scattare o scegliere una foto anche dal telefono.
                </small>
              </div>

              <div className="field image-url-field">
                <label htmlFor="image">Oppure URL immagine</label>
                <input
                  id="image"
                  name="image"
                  type="url"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>

              <div className="image-preview">
                {form.image ? (
                  <img src={form.image} alt="Anteprima" />
                ) : (
                  <div className="image-placeholder">
                    <ImagePlus size={30} />
                    <span>Nessuna immagine</span>
                  </div>
                )}
              </div>
            </div>

            <label className="active-checkbox">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              <span>
                <strong>Elemento attivo</strong>
                <small>
                  Se attivo sarà disponibile nel configuratore pubblico.
                </small>
              </span>
            </label>

            <div className="form-actions">
              {editingId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Annulla
                </button>
              )}

              <button
                type="submit"
                className="save-button"
                disabled={saving || uploading}
              >
                {saving ? (
                  <Loader2 size={19} className="spin" />
                ) : (
                  <Save size={19} />
                )}

                {saving
                  ? 'Salvataggio...'
                  : editingId
                    ? 'Salva modifiche'
                    : 'Salva elemento'}
              </button>
            </div>
          </form>
        </section>

        <section className="list-card">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">LIBRERIA</span>
              <h2>Elementi del configuratore</h2>
            </div>
          </div>

          <div className="filters">
            <div className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cerca elemento..."
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">Tutti i tipi</option>

              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader2 size={28} className="spin" />
              <span>Caricamento...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="empty-state">
              <ImagePlus size={38} />
              <h3>Nessun elemento</h3>
              <p>
                Aggiungi il primo elemento che i clienti potranno usare
                nel configuratore.
              </p>
            </div>
          ) : (
            <div className="asset-grid">
              {filteredAssets.map((asset) => (
                <article
                  className={`asset-card ${!asset.active ? 'inactive' : ''}`}
                  key={asset.id}
                >
                  <div className="asset-image">
                    {asset.image ? (
                      <img src={asset.image} alt={asset.name} />
                    ) : (
                      <div className="image-placeholder">
                        <ImagePlus size={28} />
                      </div>
                    )}

                    <span
                      className={`status-badge ${
                        asset.active ? 'active' : 'disabled'
                      }`}
                    >
                      {asset.active ? 'Attivo' : 'Disattivato'}
                    </span>
                  </div>

                  <div className="asset-content">
                    <span className="type-badge">
                      {typeLabel(asset.type)}
                    </span>

                    <h3>{asset.name}</h3>

                    <p className="asset-price">
                      {formatPrice(asset.price_modifier)}
                    </p>

                    <p className="asset-order">
                      Ordine: {asset.order ?? 0}
                    </p>

                    <div className="asset-actions">
                      <button
                        type="button"
                        className="small-button"
                        onClick={() => startEdit(asset)}
                      >
                        <Pencil size={16} />
                        Modifica
                      </button>

                      <button
                        type="button"
                        className="small-button"
                        onClick={() => toggleActive(asset)}
                      >
                        {asset.active ? 'Disattiva' : 'Attiva'}
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteAsset(asset)}
                        title="Elimina"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .admin-configurator-page {
          min-height: 100vh;
          background: #faf8f4;
          padding: 34px 20px 70px;
          color: #473a35;
        }

        .admin-configurator-container {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .top-row {
          margin-bottom: 26px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #8b5141;
          text-decoration: none;
          font-weight: 600;
        }

        .page-heading,
        .section-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .page-heading {
          margin-bottom: 26px;
        }

        .page-heading h1,
        .section-title-row h2 {
          font-family: "Cormorant Garamond", serif;
          margin: 4px 0 6px;
          color: #573c33;
        }

        .page-heading h1 {
          font-size: clamp(38px, 5vw, 56px);
          line-height: 1;
        }

        .section-title-row h2 {
          font-size: 30px;
        }

        .page-heading p {
          margin: 0;
          max-width: 680px;
          line-height: 1.65;
          color: #75665f;
        }

        .eyebrow {
          font-size: 12px;
          letter-spacing: 0.16em;
          font-weight: 700;
          color: #a86c59;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid #eadfd8;
          border-radius: 18px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 28px rgba(82, 57, 47, 0.05);
        }

        .stat-card strong {
          font-family: "Cormorant Garamond", serif;
          font-size: 36px;
          color: #8b5141;
        }

        .stat-card span {
          color: #75665f;
        }

        .editor-card,
        .list-card {
          background: white;
          border: 1px solid #eadfd8;
          border-radius: 22px;
          padding: 26px;
          margin-bottom: 24px;
          box-shadow: 0 10px 34px rgba(82, 57, 47, 0.055);
        }

        .asset-form {
          margin-top: 22px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          font-size: 14px;
          font-weight: 700;
          color: #594942;
        }

        .field input,
        .field select,
        .filters select,
        .search-box {
          border: 1px solid #ded2cb;
          border-radius: 12px;
          background: #fffdfb;
        }

        .field input,
        .field select,
        .filters select {
          min-height: 46px;
          padding: 0 13px;
          color: #473a35;
          font: inherit;
        }

        .field input:focus,
        .field select:focus,
        .filters select:focus,
        .search-box:focus-within {
          outline: none;
          border-color: #a86c59;
          box-shadow: 0 0 0 3px rgba(168, 108, 89, 0.12);
        }

        .image-section {
          display: grid;
          grid-template-columns: 1fr 1fr 150px;
          gap: 18px;
          align-items: end;
          margin-top: 20px;
        }

        .upload-button {
          min-height: 46px;
          border-radius: 12px;
          border: 1px dashed #b98b7c;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          color: #8b5141;
          background: #fdf8f5;
        }

        .field small {
          color: #8b7d76;
          line-height: 1.4;
        }

        .image-preview {
          width: 150px;
          height: 120px;
          border: 1px solid #e6dad4;
          border-radius: 14px;
          overflow: hidden;
          background: #f8f3ef;
        }

        .image-preview img,
        .asset-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #ad9a91;
        }

        .active-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 22px;
          cursor: pointer;
        }

        .active-checkbox input {
          margin-top: 4px;
          width: 17px;
          height: 17px;
          accent-color: #8b5141;
        }

        .active-checkbox span {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .active-checkbox small {
          color: #85766f;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .save-button,
        .secondary-button,
        .cancel-button,
        .small-button,
        .delete-button,
        .icon-button {
          border: 0;
          cursor: pointer;
          font: inherit;
        }

        .save-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 18px;
          border-radius: 12px;
          font-weight: 700;
        }

        .save-button {
          background: #8b5141;
          color: white;
        }

        .secondary-button {
          background: #f1e3dd;
          color: #784737;
        }

        .cancel-button {
          background: transparent;
          color: #75665f;
          padding: 0 16px;
        }

        .icon-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f7efeb;
          color: #815142;
          display: grid;
          place-items: center;
        }

        .notice {
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .notice.error {
          background: #fff0ef;
          color: #a13f38;
          border: 1px solid #f0cbc7;
        }

        .notice.success {
          background: #f0f7ef;
          color: #52724f;
          border: 1px solid #d2e4cf;
        }

        .filters {
          display: grid;
          grid-template-columns: 1fr 230px;
          gap: 14px;
          margin: 22px 0;
        }

        .search-box {
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 13px;
        }

        .search-box svg {
          color: #9b887f;
          flex: 0 0 auto;
        }

        .search-box input {
          border: 0;
          outline: 0;
          background: transparent;
          width: 100%;
          font: inherit;
          color: #473a35;
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .asset-card {
          border: 1px solid #eadfd8;
          border-radius: 17px;
          overflow: hidden;
          background: #fff;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .asset-card:hover {
          transform: translateY(-2px);
        }

        .asset-card.inactive {
          opacity: 0.65;
        }

        .asset-image {
          height: 190px;
          background: #f7f1ed;
          position: relative;
        }

        .status-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 800;
        }

        .status-badge.active {
          background: #e9f4e7;
          color: #4f744b;
        }

        .status-badge.disabled {
          background: #eee8e5;
          color: #766964;
        }

        .asset-content {
          padding: 17px;
        }

        .type-badge {
          display: inline-block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #98604f;
          font-weight: 800;
          margin-bottom: 7px;
        }

        .asset-content h3 {
          margin: 0 0 8px;
          font-family: "Cormorant Garamond", serif;
          font-size: 25px;
          color: #553d35;
        }

        .asset-price {
          font-weight: 700;
          color: #8b5141;
          margin: 0 0 5px;
        }

        .asset-order {
          color: #8b7d76;
          font-size: 13px;
          margin: 0 0 15px;
        }

        .asset-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .small-button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 9px;
          padding: 8px 10px;
          background: #f5eeea;
          color: #70483c;
          font-weight: 600;
          font-size: 13px;
        }

        .delete-button {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #fff0ef;
          color: #b54e46;
          margin-left: auto;
        }

        .loading-state,
        .empty-state {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 8px;
          color: #8b7d76;
        }

        .empty-state h3 {
          margin: 6px 0 0;
          color: #594942;
        }

        .empty-state p {
          margin: 0;
          max-width: 420px;
        }

        .spin {
          animation: admin-config-spin 0.8s linear infinite;
        }

        @keyframes admin-config-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .asset-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .image-section {
            grid-template-columns: 1fr 1fr;
          }

          .image-preview {
            width: 100%;
            height: 180px;
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 650px) {
          .admin-configurator-page {
            padding: 22px 14px 55px;
          }

          .page-heading,
          .section-title-row {
            flex-direction: column;
          }

          .page-heading .secondary-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .form-grid,
          .image-section,
          .filters,
          .asset-grid {
            grid-template-columns: 1fr;
          }

          .image-preview {
            grid-column: auto;
            height: 220px;
          }

          .editor-card,
          .list-card {
            padding: 19px;
            border-radius: 18px;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .save-button,
          .cancel-button {
            width: 100%;
            min-height: 46px;
          }

          .asset-image {
            height: 230px;
          }
        }
      `}</style>
    </main>
  )
}

export default AdminConfigurator