import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  LoaderCircle,
  Save,
  Truck,
  Gift,
  PackageCheck,
} from 'lucide-react'

import { supabase } from '../supabaseClient'

function AdminShipping() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settingsId, setSettingsId] = useState(null)

  const [
    freeShippingThreshold,
    setFreeShippingThreshold,
  ] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } =
        await supabase
          .from('store_settings')
          .select(
            'id, free_shipping_threshold'
          )
          .limit(1)
          .maybeSingle()

      if (loadError) {
        throw loadError
      }

      if (data) {
        setSettingsId(data.id)

        setFreeShippingThreshold(
          data.free_shipping_threshold !== null &&
            data.free_shipping_threshold !== undefined
            ? String(
                data.free_shipping_threshold
              )
            : ''
        )
      }
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile caricare le impostazioni di spedizione.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings(event) {
    event.preventDefault()

    const threshold = Number(
      String(
        freeShippingThreshold
      ).replace(',', '.')
    )

    if (
      !Number.isFinite(threshold) ||
      threshold < 0
    ) {
      setError(
        'Inserisci una soglia per la spedizione gratuita valida.'
      )
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      free_shipping_threshold: threshold,
      updated_at: new Date().toISOString(),
    }

    try {
      if (settingsId) {
        const { error: updateError } =
          await supabase
            .from('store_settings')
            .update(payload)
            .eq('id', settingsId)

        if (updateError) {
          throw updateError
        }
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from('store_settings')
          .insert(payload)
          .select('id')
          .single()

        if (insertError) {
          throw insertError
        }

        setSettingsId(data.id)
      }

      setSuccess(
        'Impostazioni di spedizione salvate correttamente.'
      )
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile salvare le impostazioni.'
      )
    } finally {
      setSaving(false)
    }
  }

  const previewThreshold =
    Number(
      String(
        freeShippingThreshold
      ).replace(',', '.')
    ) || 0

  function money(value) {
    return Number(value || 0).toLocaleString(
      'it-IT',
      {
        style: 'currency',
        currency: 'EUR',
      }
    )
  }

  if (loading) {
    return (
      <main className="shipping-loading">
        <LoaderCircle
          size={32}
          className="shipping-spinner"
        />

        <span>
          Caricamento impostazioni...
        </span>

        <style>{styles}</style>
      </main>
    )
  }

  return (
    <main className="shipping-page">
      <div className="container-ery">
        <header className="shipping-header">
          <div>
            <Link
              to="/admin"
              className="shipping-back"
            >
              <ArrowLeft size={16} />
              Amministrazione
            </Link>

            <span className="shipping-kicker">
              Negozio
            </span>

            <h1>Spedizioni</h1>

            <p>
              Il costo viene calcolato automaticamente in base
              a peso e dimensioni. Qui gestisci la soglia gratuita.
            </p>
          </div>

          <div className="shipping-header-icon">
            <Truck size={28} />
          </div>
        </header>

        {error && (
          <div className="shipping-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="shipping-alert success">
            {success}
          </div>
        )}

        <div className="shipping-layout">
          <form
            className="shipping-card"
            onSubmit={saveSettings}
          >
            <div className="shipping-card-title">
              <Truck size={20} />

              <div>
                <span>Configurazione</span>
                <h2>
                  Spedizione automatica
                </h2>
              </div>
            </div>

            <div className="shipping-auto-info">
              <div className="shipping-auto-icon">
                <PackageCheck size={20} />
              </div>

              <div>
                <strong>Calcolo automatico attivo</strong>
                <p>
                  Il costo di spedizione viene calcolato automaticamente
                  dal sistema usando peso e dimensioni del pacco inseriti
                  nella scheda di ogni prodotto.
                </p>
              </div>
            </div>

            <label className="shipping-field">
              <span>
                Spedizione gratuita da
              </span>

              <div className="shipping-input-wrap">
                <Gift size={16} />

                <input
                  type="number"
                  className="input-ery"
                  min="0"
                  step="0.01"
                  value={
                    freeShippingThreshold
                  }
                  onChange={(event) =>
                    setFreeShippingThreshold(
                      event.target.value
                    )
                  }
                  placeholder="Es. 70.00"
                  required
                />
              </div>

              <small>
                Da questo importo in poi il
                cliente non paga la spedizione.
              </small>
            </label>

            <button
              type="submit"
              className="btn-primary shipping-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="shipping-spinner"
                  />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Salva impostazioni
                </>
              )}
            </button>
          </form>

          <aside className="shipping-preview">
            <span className="shipping-kicker">
              Anteprima
            </span>

            <h2>
              Come funzionerà
            </h2>

            <div className="shipping-preview-box">
              <div className="shipping-preview-row">
                <div className="shipping-preview-icon">
                  <PackageCheck size={20} />
                </div>

                <div>
                  <span>Costo spedizione</span>
                  <strong>Calcolo automatico</strong>
                </div>
              </div>

              <div className="shipping-preview-row">
                <div className="shipping-preview-icon">
                  <Gift size={20} />
                </div>

                <div>
                  <span>
                    Spedizione gratuita
                  </span>

                  <strong>
                    da{' '}
                    {money(
                      previewThreshold
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <p>
              Il cliente vedrà nel Checkout il costo calcolato in base
              ai dati di spedizione dei prodotti. Raggiunta la soglia di{' '}
              <strong>{money(previewThreshold)}</strong>, la spedizione
              sarà gratuita.
            </p>
          </aside>
        </div>
      </div>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .shipping-page {
    min-height: 75vh;
    padding: 45px 0 90px;
  }

  .shipping-loading {
    min-height: 65vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #83766f;
    font-size: 12px;
  }

  .shipping-spinner {
    animation: shipping-spin 1s linear infinite;
  }

  @keyframes shipping-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .shipping-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 25px;
    margin-bottom: 28px;
  }

  .shipping-back {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    color: #85766f;
    font-size: 11px;
    text-decoration: none;
  }

  .shipping-kicker {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
  }

  .shipping-header h1 {
    margin: 3px 0 5px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px;
    font-weight: 500;
  }

  .shipping-header p {
    max-width: 560px;
    margin: 0;
    color: #877a73;
    font-size: 12px;
    line-height: 1.6;
  }

  .shipping-header-icon {
    width: 62px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(224,169,155,.15);
    color: var(--terracotta);
  }

  .shipping-alert {
    margin-bottom: 18px;
    padding: 12px 15px;
    border-radius: 12px;
    font-size: 11px;
  }

  .shipping-alert.error {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .shipping-alert.success {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .shipping-layout {
    display: grid;
    grid-template-columns:
      minmax(0, 1.4fr)
      minmax(280px, .8fr);
    gap: 20px;
    align-items: start;
  }

  .shipping-card,
  .shipping-preview {
    padding: 25px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 20px;
    background: white;
    box-shadow:
      0 8px 30px rgba(73,54,45,.04);
  }

  .shipping-card-title {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 25px;
    color: var(--terracotta);
  }

  .shipping-card-title span {
    color: var(--terracotta);
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .shipping-card-title h2 {
    margin: 2px 0 0;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 27px;
  }

  .shipping-auto-info {
    display: flex;
    gap: 12px;
    margin-bottom: 22px;
    padding: 15px;
    border-radius: 14px;
    background: rgba(144,153,139,.08);
  }

  .shipping-auto-icon {
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: white;
    color: var(--terracotta);
  }

  .shipping-auto-info strong {
    display: block;
    margin-bottom: 4px;
    color: #514640;
    font-size: 11px;
  }

  .shipping-auto-info p {
    margin: 0;
    color: #81756f;
    font-size: 9px;
    line-height: 1.6;
  }

  .shipping-field {
    display: block;
    margin-bottom: 22px;
  }

  .shipping-field > span {
    display: block;
    margin-bottom: 7px;
    color: #615650;
    font-size: 10px;
    font-weight: 600;
  }

  .shipping-field small {
    display: block;
    margin-top: 6px;
    color: #968b85;
    font-size: 9px;
    line-height: 1.5;
  }

  .shipping-input-wrap {
    position: relative;
  }

  .shipping-input-wrap svg {
    position: absolute;
    z-index: 2;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--terracotta);
    pointer-events: none;
  }

  .shipping-input-wrap input {
    width: 100%;
    padding-left: 40px;
  }

  .shipping-save {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }

  .shipping-preview h2 {
    margin: 4px 0 20px;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 29px;
  }

  .shipping-preview-box {
    display: grid;
    gap: 10px;
    margin-bottom: 18px;
  }

  .shipping-preview-row {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 14px;
    border-radius: 13px;
    background: rgba(144,153,139,.08);
  }

  .shipping-preview-icon {
    width: 39px;
    height: 39px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: white;
    color: var(--terracotta);
  }

  .shipping-preview-row div:last-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .shipping-preview-row span {
    color: #8b8079;
    font-size: 8px;
    text-transform: uppercase;
  }

  .shipping-preview-row strong {
    color: #514640;
    font-size: 13px;
  }

  .shipping-preview > p {
    margin: 0;
    color: #81756f;
    font-size: 10px;
    line-height: 1.7;
  }

  @media (max-width: 800px) {
    .shipping-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .shipping-header {
      align-items: flex-start;
    }

    .shipping-header-icon {
      display: none;
    }

    .shipping-card,
    .shipping-preview {
      padding: 20px;
    }
  }
`

export default AdminShipping