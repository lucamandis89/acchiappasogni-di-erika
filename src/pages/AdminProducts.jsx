import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  Edit3,
  LoaderCircle,
  Package,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const emptyForm = {
  name: '',
  sku: '',
  category_name: '',
  short_description: '',
  description: '',
  price: '',
  sale_price: '',
  stock: '1',
  dimensions: '',
  weight: '',
  shipping_weight_grams: '',
  package_length_cm: '',
  package_width_cm: '',
  package_height_cm: '',
  materials: '',
  colors: '',
  personalizable: false,
  made_to_order: false,
  unique_piece: false,
  is_new: true,
  featured: false,
  active: true,
  cover_image: '',
  images: [],
}

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setError(`Errore caricamento prodotti: ${error.message}`)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function openNewProduct() {
    setEditingId(null)
    setForm(emptyForm)
    setPhotos([])
    setMessage('')
    setError('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function openEditProduct(product) {
    setEditingId(product.id)

    setForm({
      name: product.name || '',
      sku: product.sku || '',
      category_name: product.category_name || '',
      short_description: product.short_description || '',
      description: product.description || '',
      price: product.price ?? '',
      sale_price: product.sale_price ?? '',
      stock: product.stock ?? '0',
      dimensions: product.dimensions || '',
      weight: product.weight || '',
      shipping_weight_grams: product.shipping_weight_grams ?? '',
      package_length_cm: product.package_length_cm ?? '',
      package_width_cm: product.package_width_cm ?? '',
      package_height_cm: product.package_height_cm ?? '',
      materials: Array.isArray(product.materials)
        ? product.materials.join(', ')
        : product.materials || '',
      colors: Array.isArray(product.colors)
        ? product.colors.join(', ')
        : product.colors || '',
      personalizable: Boolean(product.personalizable),
      made_to_order: Boolean(product.made_to_order),
      unique_piece: Boolean(product.unique_piece),
      is_new: Boolean(product.is_new),
      featured: Boolean(product.featured),
      active: product.active !== false,
      cover_image: product.cover_image || '',
      images: Array.isArray(product.images)
        ? product.images
        : [],
    })

    const currentPhotos = []

    if (product.cover_image) {
      currentPhotos.push(product.cover_image)
    }

    if (Array.isArray(product.images)) {
      product.images.forEach((image) => {
        if (image && !currentPhotos.includes(image)) {
          currentPhotos.push(image)
        }
      })
    }

    setPhotos(currentPhotos)
    setMessage('')
    setError('')
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
    setPhotos([])
    setMessage('')
    setError('')
  }

  async function uploadPhotos(event) {
    const files = Array.from(event.target.files || [])

    if (!files.length) return

    setUploading(true)
    setError('')

    try {
      const uploadedUrls = []

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          continue
        }

        const extension =
          file.name.split('.').pop()?.toLowerCase() || 'jpg'

        const safeExtension =
          extension.replace(/[^a-z0-9]/g, '') || 'jpg'

        const fileName =
          `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExtension}`

        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          })

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl)
        }
      }

      setPhotos((current) => [
        ...current,
        ...uploadedUrls.filter(
          (url) => !current.includes(url)
        ),
      ])
    } catch (uploadError) {
      console.error(uploadError)
      setError(
        `Errore caricamento foto: ${uploadError.message}`
      )
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function removePhoto(url) {
    setPhotos((current) =>
      current.filter((photo) => photo !== url)
    )
  }

  async function saveProduct(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Inserisci il nome del prodotto.')
      return
    }

    const price = Number(form.price)

    if (!Number.isFinite(price) || price < 0) {
      setError('Inserisci un prezzo valido.')
      return
    }

    const stock = parseInt(form.stock, 10)

    if (!Number.isInteger(stock) || stock < 0) {
      setError('Inserisci una quantità valida.')
      return
    }

    const parseOptionalNumber = (value) => {
      if (value === '' || value === null || value === undefined) return null
      const parsed = Number(String(value).replace(',', '.'))
      return Number.isFinite(parsed) ? parsed : NaN
    }

    const shippingWeightGrams = parseOptionalNumber(form.shipping_weight_grams)
    const packageLengthCm = parseOptionalNumber(form.package_length_cm)
    const packageWidthCm = parseOptionalNumber(form.package_width_cm)
    const packageHeightCm = parseOptionalNumber(form.package_height_cm)

    if (
      [shippingWeightGrams, packageLengthCm, packageWidthCm, packageHeightCm]
        .some((value) => Number.isNaN(value) || (value !== null && value < 0))
    ) {
      setError('Controlla peso e dimensioni del pacco: devono essere numeri validi.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const materials = form.materials
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const colors = form.colors
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      category_name: form.category_name.trim() || null,
      short_description:
        form.short_description.trim() || null,
      description: form.description.trim() || null,
      price,
      sale_price:
        form.sale_price === ''
          ? null
          : Number(form.sale_price),
      stock,
      dimensions: form.dimensions.trim() || null,
      weight: form.weight.trim() || null,
      shipping_weight_grams:
        shippingWeightGrams === null ? null : Math.round(shippingWeightGrams),
      package_length_cm: packageLengthCm,
      package_width_cm: packageWidthCm,
      package_height_cm: packageHeightCm,
      materials,
      colors,
      personalizable: form.personalizable,
      made_to_order: form.made_to_order,
      unique_piece: form.unique_piece,
      is_new: form.is_new,
      featured: form.featured,
      active: form.active,
      cover_image: photos[0] || null,
      images: photos,
    }

    let result

    if (editingId) {
      result = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()
    } else {
      result = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single()
    }

    if (result.error) {
      console.error(result.error)
      setError(`Errore salvataggio: ${result.error.message}`)
      setSaving(false)
      return
    }

    setMessage(
      editingId
        ? 'Prodotto aggiornato correttamente.'
        : 'Prodotto pubblicato correttamente.'
    )

    await loadProducts()

    window.setTimeout(() => {
      closeForm()
    }, 900)

    setSaving(false)
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Vuoi davvero eliminare "${product.name}"?`
    )

    if (!confirmed) return

    setError('')
    setMessage('')

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (error) {
      console.error(error)
      setError(`Errore eliminazione: ${error.message}`)
      return
    }

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    )

    setMessage('Prodotto eliminato.')
  }

  return (
    <main className="admin-products-page">
      <div className="container-ery">
        <div className="admin-products-top">
          <div>
            <Link to="/admin" className="admin-back">
              <ArrowLeft size={17} />
              Amministrazione
            </Link>

            <span className="admin-kicker">
              Catalogo
            </span>

            <h1>Prodotti</h1>

            <p>
              Aggiungi e gestisci gli acchiappasogni
              presenti nello Shop.
            </p>
          </div>

          {!showForm && (
            <button
              type="button"
              className="btn-primary admin-new-product"
              onClick={openNewProduct}
            >
              <Plus size={18} />
              Nuovo prodotto
            </button>
          )}
        </div>

        {error && (
          <div className="admin-alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="admin-alert success">
            {message}
          </div>
        )}

        {showForm && (
          <section className="product-editor">
            <div className="product-editor-heading">
              <div>
                <span className="admin-kicker">
                  {editingId
                    ? 'Modifica prodotto'
                    : 'Nuova creazione'}
                </span>

                <h2>
                  {editingId
                    ? 'Modifica acchiappasogni'
                    : 'Aggiungi un acchiappasogni'}
                </h2>
              </div>

              <button
                type="button"
                className="editor-close"
                onClick={closeForm}
                aria-label="Chiudi"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="photo-upload-section">
                <label className="photo-upload-button">
                  {uploading ? (
                    <LoaderCircle
                      size={24}
                      className="spin"
                    />
                  ) : (
                    <Camera size={25} />
                  )}

                  <strong>
                    {uploading
                      ? 'Caricamento...'
                      : 'Aggiungi foto'}
                  </strong>

                  <span>
                    Scatta una foto o sceglila dal telefono
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={uploadPhotos}
                    disabled={uploading}
                  />
                </label>

                {photos.length > 0 && (
                  <div className="uploaded-photos">
                    {photos.map((photo, index) => (
                      <div
                        className="uploaded-photo"
                        key={photo}
                      >
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                        />

                        {index === 0 && (
                          <span className="cover-label">
                            Copertina
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removePhoto(photo)}
                          aria-label="Rimuovi foto"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-form-grid">
                <label className="admin-field full">
                  <span>Nome prodotto *</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="Es. Acchiappasogni Luna"
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Codice / SKU</span>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={updateField}
                    placeholder="ERY-001"
                  />
                </label>

                <label className="admin-field">
                  <span>Categoria</span>
                  <input
                    name="category_name"
                    value={form.category_name}
                    onChange={updateField}
                    placeholder="Es. Classici"
                  />
                </label>

                <label className="admin-field">
                  <span>Prezzo € *</span>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={updateField}
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Prezzo in offerta €</span>
                  <input
                    type="number"
                    name="sale_price"
                    min="0"
                    step="0.01"
                    value={form.sale_price}
                    onChange={updateField}
                  />
                </label>

                <label className="admin-field">
                  <span>Quantità disponibile *</span>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={updateField}
                    required
                  />
                </label>

                <label className="admin-field">
                  <span>Dimensioni</span>
                  <input
                    name="dimensions"
                    value={form.dimensions}
                    onChange={updateField}
                    placeholder="Es. 30 × 70 cm"
                  />
                </label>

                <label className="admin-field">
                  <span>Peso</span>
                  <input
                    name="weight"
                    value={form.weight}
                    onChange={updateField}
                    placeholder="Es. 250 g"
                  />
                </label>

                <div className="admin-field full shipping-data-heading">
                  <strong>Dati per la spedizione</strong>
                  <small>
                    Inserisci peso e misure del pacco già imballato. Questi dati
                    serviranno per calcolare automaticamente la tariffa di spedizione.
                  </small>
                </div>

                <label className="admin-field">
                  <span>Peso pacco (grammi)</span>
                  <input
                    type="number"
                    name="shipping_weight_grams"
                    min="0"
                    step="1"
                    value={form.shipping_weight_grams}
                    onChange={updateField}
                    placeholder="Es. 750"
                  />
                </label>

                <label className="admin-field">
                  <span>Lunghezza pacco (cm)</span>
                  <input
                    type="number"
                    name="package_length_cm"
                    min="0"
                    step="0.1"
                    value={form.package_length_cm}
                    onChange={updateField}
                    placeholder="Es. 50"
                  />
                </label>

                <label className="admin-field">
                  <span>Larghezza pacco (cm)</span>
                  <input
                    type="number"
                    name="package_width_cm"
                    min="0"
                    step="0.1"
                    value={form.package_width_cm}
                    onChange={updateField}
                    placeholder="Es. 40"
                  />
                </label>

                <label className="admin-field">
                  <span>Altezza pacco (cm)</span>
                  <input
                    type="number"
                    name="package_height_cm"
                    min="0"
                    step="0.1"
                    value={form.package_height_cm}
                    onChange={updateField}
                    placeholder="Es. 15"
                  />
                </label>

                <label className="admin-field">
                  <span>Materiali</span>
                  <input
                    name="materials"
                    value={form.materials}
                    onChange={updateField}
                    placeholder="Legno, cotone, piume"
                  />
                </label>

                <label className="admin-field full">
                  <span>Colori</span>
                  <input
                    name="colors"
                    value={form.colors}
                    onChange={updateField}
                    placeholder="Bianco, beige, rosa"
                  />
                </label>

                <label className="admin-field full">
                  <span>Descrizione breve</span>
                  <textarea
                    name="short_description"
                    rows="3"
                    value={form.short_description}
                    onChange={updateField}
                    placeholder="Breve descrizione mostrata al cliente..."
                  />
                </label>

                <label className="admin-field full">
                  <span>Descrizione completa</span>
                  <textarea
                    name="description"
                    rows="6"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Racconta questa creazione..."
                  />
                </label>
              </div>

              <div className="product-options">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={updateField}
                  />
                  <span>
                    <strong>Pubblicato</strong>
                    Visibile nello Shop
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="is_new"
                    checked={form.is_new}
                    onChange={updateField}
                  />
                  <span>
                    <strong>Novità</strong>
                    Mostra etichetta Novità
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={updateField}
                  />
                  <span>
                    <strong>In evidenza</strong>
                    Mostra tra i prodotti principali
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="unique_piece"
                    checked={form.unique_piece}
                    onChange={updateField}
                  />
                  <span>
                    <strong>Pezzo unico</strong>
                    Creazione non replicata
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="personalizable"
                    checked={form.personalizable}
                    onChange={updateField}
                  />
                  <span>
                    <strong>Personalizzabile</strong>
                    Il cliente può richiedere modifiche
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="made_to_order"
                    checked={form.made_to_order}
                    onChange={updateField}
                  />
                  <span>
                    <strong>Su ordinazione</strong>
                    Realizzato dopo l'ordine, senza stock fisico
                  </span>
                </label>
              </div>

              <div className="editor-actions">
                <button
                  type="button"
                  className="admin-cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || uploading}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="spin"
                      />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
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

        {!showForm && (
          <section className="admin-product-list">
            {loading ? (
              <div className="admin-loading">
                <LoaderCircle
                  size={28}
                  className="spin"
                />
                Caricamento prodotti...
              </div>
            ) : products.length === 0 ? (
              <div className="admin-empty">
                <Package size={42} />
                <h2>Nessun prodotto</h2>
                <p>
                  Aggiungi la prima creazione al tuo negozio.
                </p>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={openNewProduct}
                >
                  <Plus size={18} />
                  Nuovo prodotto
                </button>
              </div>
            ) : (
              <div className="admin-product-grid">
                {products.map((product) => {
                  const price = Number(product.price || 0)
                  const salePrice =
                    Number(product.sale_price || 0)

                  const shownPrice =
                    salePrice > 0 && salePrice < price
                      ? salePrice
                      : price

                  return (
                    <article
                      className="admin-product-card"
                      key={product.id}
                    >
                      <div className="admin-product-image">
                        {product.cover_image ? (
                          <img
                            src={product.cover_image}
                            alt={product.name}
                          />
                        ) : (
                          <Package size={34} />
                        )}

                        <span
                          className={
                            product.active
                              ? 'product-status active'
                              : 'product-status inactive'
                          }
                        >
                          {product.active
                            ? 'Pubblicato'
                            : 'Nascosto'}
                        </span>
                      </div>

                      <div className="admin-product-content">
                        <div>
                          <span className="admin-product-category">
                            {product.category_name ||
                              'Senza categoria'}
                          </span>

                          <h3>{product.name}</h3>

                          <strong className="admin-product-price">
                            € {shownPrice.toFixed(2)}
                          </strong>

                          <span className="admin-product-stock">
                            Quantità: {product.stock ?? 0}
                          </span>
                        </div>

                        <div className="admin-product-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openEditProduct(product)
                            }
                          >
                            <Edit3 size={16} />
                            Modifica
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              deleteProduct(product)
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>

      <style>{`
        .admin-products-page {
          min-height: 75vh;
          padding: 45px 0 90px;
          background: #fbf8f5;
        }

        .admin-products-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 35px;
        }

        .admin-back {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 25px;
          color: var(--terracotta);
          font-size: 12px;
          font-weight: 700;
        }

        .admin-kicker {
          display: block;
          margin-bottom: 5px;
          color: var(--terracotta);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .admin-products-top h1 {
          margin: 0;
          color: #443731;
          font-size: clamp(42px, 6vw, 62px);
          font-weight: 500;
          line-height: 1;
        }

        .admin-products-top p {
          margin: 10px 0 0;
          color: #786d67;
          font-size: 13px;
        }

        .admin-new-product,
        .editor-actions .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .admin-alert {
          margin-bottom: 20px;
          padding: 13px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .admin-alert.error {
          background: #f8e7e3;
          color: #91493d;
        }

        .admin-alert.success {
          background: #e8efe6;
          color: #566c52;
        }

        .product-editor {
          padding: 30px;
          border: 1px solid rgba(112,83,70,.1);
          border-radius: 24px;
          background: white;
          box-shadow: 0 10px 35px rgba(67,48,39,.06);
        }

        .product-editor-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .product-editor-heading h2 {
          margin: 0;
          color: #443731;
          font-size: 32px;
          font-weight: 500;
        }

        .editor-close {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(112,83,70,.15);
          border-radius: 50%;
          background: white;
          color: var(--terracotta);
        }

        .photo-upload-section {
          margin-bottom: 30px;
        }

        .photo-upload-button {
          min-height: 145px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 20px;
          border: 2px dashed rgba(112,83,70,.22);
          border-radius: 18px;
          background: #fcfaf8;
          color: var(--terracotta);
          cursor: pointer;
          text-align: center;
        }

        .photo-upload-button strong {
          font-size: 14px;
        }

        .photo-upload-button span {
          color: #8a7d76;
          font-size: 11px;
        }

        .photo-upload-button input {
          display: none;
        }

        .uploaded-photos {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          overflow-x: auto;
          padding-bottom: 5px;
        }

        .uploaded-photo {
          position: relative;
          flex: 0 0 110px;
          width: 110px;
          height: 110px;
          overflow: hidden;
          border-radius: 14px;
        }

        .uploaded-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .uploaded-photo button {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,.93);
          color: #944d40;
        }

        .cover-label {
          position: absolute;
          bottom: 5px;
          left: 5px;
          padding: 4px 7px;
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          color: var(--terracotta);
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .admin-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .admin-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .admin-field.full {
          grid-column: 1 / -1;
        }

        .admin-field > span {
          color: #5d504a;
          font-size: 11px;
          font-weight: 700;
        }

        .admin-field input,
        .admin-field textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border: 1px solid rgba(112,83,70,.18);
          border-radius: 11px;
          outline: none;
          background: #fff;
          color: #493d37;
          font: inherit;
          font-size: 13px;
        }

        .admin-field textarea {
          resize: vertical;
        }

        .shipping-data-heading {
          margin-top: 8px;
          padding: 14px;
          border-radius: 12px;
          background: rgba(224,169,155,.10);
          color: #5d504a;
        }

        .shipping-data-heading strong {
          font-size: 13px;
        }

        .shipping-data-heading small {
          color: #8a7d76;
          font-size: 10px;
          line-height: 1.5;
        }

        .admin-field input:focus,
        .admin-field textarea:focus {
          border-color: var(--terracotta);
        }

        .product-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 25px;
        }

        .product-options label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px;
          border: 1px solid rgba(112,83,70,.12);
          border-radius: 12px;
          cursor: pointer;
        }

        .product-options input {
          margin-top: 3px;
          accent-color: var(--terracotta);
        }

        .product-options span {
          display: flex;
          flex-direction: column;
          color: #8a7e78;
          font-size: 10px;
        }

        .product-options strong {
          color: #544740;
          font-size: 12px;
        }

        .editor-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(112,83,70,.1);
        }

        .admin-cancel {
          padding: 11px 20px;
          border: 1px solid rgba(112,83,70,.18);
          border-radius: 999px;
          background: white;
          color: #655851;
          font-weight: 700;
        }

        .admin-loading,
        .admin-empty {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-align: center;
          color: #887a73;
        }

        .admin-empty h2 {
          margin: 0;
          color: #493c36;
          font-size: 30px;
          font-weight: 500;
        }

        .admin-empty p {
          margin: 0 0 10px;
          font-size: 12px;
        }

        .admin-product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .admin-product-card {
          overflow: hidden;
          border: 1px solid rgba(112,83,70,.1);
          border-radius: 18px;
          background: white;
        }

        .admin-product-image {
          position: relative;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #eee9e5;
          color: #a89991;
        }

        .admin-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-status {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .product-status.active {
          background: rgba(255,255,255,.92);
          color: #5f755b;
        }

        .product-status.inactive {
          background: rgba(255,255,255,.92);
          color: #9b5043;
        }

        .admin-product-content {
          padding: 15px;
        }

        .admin-product-category {
          color: #9b8e87;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .admin-product-content h3 {
          margin: 4px 0 8px;
          color: #493c36;
          font-size: 20px;
          font-weight: 600;
        }

        .admin-product-price,
        .admin-product-stock {
          display: block;
        }

        .admin-product-price {
          color: var(--terracotta);
          font-size: 17px;
        }

        .admin-product-stock {
          margin-top: 3px;
          color: #8b7f79;
          font-size: 10px;
        }

        .admin-product-actions {
          display: flex;
          gap: 7px;
          margin-top: 15px;
        }

        .admin-product-actions button {
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid rgba(112,83,70,.14);
          border-radius: 999px;
          background: white;
          color: var(--terracotta);
          font-size: 10px;
          font-weight: 700;
        }

        .admin-product-actions button:first-child {
          flex: 1;
        }

        .admin-product-actions .delete {
          width: 38px;
          padding: 0;
          color: #a14f43;
        }

        .spin {
          animation: admin-spin .8s linear infinite;
        }

        @keyframes admin-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .admin-product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .admin-products-page {
            padding-top: 25px;
          }

          .admin-products-top {
            align-items: stretch;
            flex-direction: column;
          }

          .admin-new-product {
            width: 100%;
          }

          .product-editor {
            padding: 18px;
            border-radius: 18px;
          }

          .admin-form-grid,
          .product-options {
            grid-template-columns: 1fr;
          }

          .admin-field.full {
            grid-column: auto;
          }

          .editor-actions {
            flex-direction: column-reverse;
          }

          .editor-actions button {
            width: 100%;
          }

          .admin-product-grid {
            grid-template-columns: 1fr;
          }

          .admin-product-image {
            height: 280px;
          }
        }
      `}</style>
    </main>
  )
}

export default AdminProducts