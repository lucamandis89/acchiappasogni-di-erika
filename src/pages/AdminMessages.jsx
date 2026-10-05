import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Trash2,
  User,
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

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [workingId, setWorkingId] = useState(null)
  const [savedNoteId, setSavedNoteId] = useState(null)

  useEffect(() => {
    loadMessages()
  }, [])

  async function loadMessages() {
    setLoading(true)
    setError('')

    try {
      const { data, error: loadError } =
        await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', {
            ascending: false,
          })

      if (loadError) {
        throw loadError
      }

      const rows = (data || []).map((message) => ({
        ...message,
        admin_notes: message.admin_notes ?? '',
      }))

      setMessages(rows)
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile caricare i messaggi.'
      )
    } finally {
      setLoading(false)
    }
  }

  function updateLocalMessage(id, field, value) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? {
              ...message,
              [field]: value,
            }
          : message
      )
    )
  }

  async function updateMessage(id, changes) {
    setWorkingId(id)
    setError('')
    setSuccess('')

    try {
      const { data: updatedRows, error: updateError } =
        await supabase
          .from('contact_messages')
          .update(changes)
          .eq('id', id)
          .select('*')

      if (updateError) {
        throw updateError
      }

      if (!updatedRows || updatedRows.length !== 1) {
        throw new Error(
          'Il database non ha confermato il salvataggio. Controlla i permessi di aggiornamento della tabella contact_messages.'
        )
      }

      const updatedMessage = updatedRows[0]

      setMessages((current) =>
        current.map((message) =>
          message.id === id
            ? updatedMessage
            : message
        )
      )

      return updatedMessage
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile aggiornare il messaggio.'
      )

      return false
    } finally {
      setWorkingId(null)
    }
  }

  async function toggleRead(message) {
    const nextValue = !message.is_read

    const ok = await updateMessage(
      message.id,
      {
        is_read: nextValue,
      }
    )

    if (ok) {
      setSuccess(
        nextValue
          ? 'Messaggio segnato come letto.'
          : 'Messaggio segnato come non letto.'
      )
    }
  }

  async function changeStatus(message, status) {
    const ok = await updateMessage(
      message.id,
      {
        status,
      }
    )

    if (ok) {
      setSuccess('Stato aggiornato.')
    }
  }

  async function saveNotes(message) {
    setSavedNoteId(null)

    const ok = await updateMessage(
      message.id,
      {
        admin_notes:
          message.admin_notes?.trim() || '',
      }
    )

    if (ok) {
      setSuccess('Nota salvata correttamente.')
      setSavedNoteId(message.id)

      window.setTimeout(() => {
        setSavedNoteId((current) =>
          current === message.id ? null : current
        )
      }, 2500)
    }
  }

  async function deleteMessage(message) {
    const confirmed = window.confirm(
      `Vuoi eliminare il messaggio di "${
        message.name ||
        message.customer_name ||
        'questo cliente'
      }"?`
    )

    if (!confirmed) return

    setWorkingId(message.id)
    setError('')
    setSuccess('')

    try {
      const { error: deleteError } =
        await supabase
          .from('contact_messages')
          .delete()
          .eq('id', message.id)

      if (deleteError) {
        throw deleteError
      }

      setMessages((current) =>
        current.filter(
          (item) => item.id !== message.id
        )
      )

      setSuccess('Messaggio eliminato.')
    } catch (err) {
      console.error(err)

      setError(
        err?.message ||
          'Impossibile eliminare il messaggio.'
      )
    } finally {
      setWorkingId(null)
    }
  }

  function getName(message) {
    return (
      message.name ||
      message.customer_name ||
      'Cliente'
    )
  }

  function getEmail(message) {
    return message.email || ''
  }

  function getPhone(message) {
    return message.phone || ''
  }

  function getSubject(message) {
    return (
      message.subject ||
      message.title ||
      'Richiesta dal sito'
    )
  }

  function getBody(message) {
    return (
      message.message ||
      message.content ||
      message.body ||
      ''
    )
  }

  function whatsappLink(phone) {
    if (!phone) return '#'

    const clean = phone.replace(/[^\d+]/g, '')

    return `https://wa.me/${clean.replace(
      '+',
      ''
    )}`
  }

  const unreadCount = messages.filter(
    (message) => !message.is_read
  ).length

  const openCount = messages.filter(
    (message) =>
      !message.status ||
      message.status === 'new' ||
      message.status === 'open'
  ).length

  return (
    <main className="messages-page">
      <div className="container-ery">
        <header className="messages-header">
          <div>
            <Link
              to="/admin"
              className="messages-back"
            >
              <ArrowLeft size={16} />
              Amministrazione
            </Link>

            <span className="messages-kicker">
              Contatti
            </span>

            <h1>Messaggi</h1>

            <p>
              Gestisci le richieste ricevute dal
              sito.
            </p>
          </div>

          <button
            type="button"
            className="btn-outline refresh-button"
            onClick={loadMessages}
          >
            <RefreshCw size={16} />
            Aggiorna
          </button>
        </header>

        {error && (
          <div className="message-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="message-alert success">
            {success}
          </div>
        )}

        <section className="messages-summary">
          <div className="summary-card">
            <Mail size={21} />

            <div>
              <strong>{messages.length}</strong>
              <span>Totali</span>
            </div>
          </div>

          <div className="summary-card">
            <EyeOff size={21} />

            <div>
              <strong>{unreadCount}</strong>
              <span>Da leggere</span>
            </div>
          </div>

          <div className="summary-card">
            <MessageCircle size={21} />

            <div>
              <strong>{openCount}</strong>
              <span>Aperti</span>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="messages-loading">
            <LoaderCircle
              size={30}
              className="messages-spinner"
            />

            Caricamento messaggi...
          </div>
        ) : messages.length === 0 ? (
          <section className="messages-empty">
            <Mail size={38} />

            <h2>Nessun messaggio</h2>

            <p>
              Le richieste inviate dal modulo
              Contatti compariranno qui.
            </p>
          </section>
        ) : (
          <section className="messages-list">
            {messages.map((message) => {
              const name = getName(message)
              const email = getEmail(message)
              const phone = getPhone(message)
              const subject = getSubject(message)
              const body = getBody(message)

              return (
                <article
                  key={message.id}
                  className={`message-card ${
                    !message.is_read
                      ? 'unread'
                      : ''
                  }`}
                >
                  <div className="message-card-top">
                    <div className="message-person">
                      <div className="message-avatar">
                        <User size={19} />
                      </div>

                      <div>
                        <div className="message-badges">
                          {!message.is_read && (
                            <span className="new-badge">
                              Nuovo
                            </span>
                          )}

                          {message.status ===
                            'closed' && (
                            <span className="closed-badge">
                              Chiuso
                            </span>
                          )}
                        </div>

                        <h2>{name}</h2>

                        <span className="message-date">
                          {formatDate(
                            message.created_at
                          )}
                        </span>
                      </div>
                    </div>

                    <select
                      value={
                        message.status || 'new'
                      }
                      disabled={
                        workingId === message.id
                      }
                      onChange={(event) =>
                        changeStatus(
                          message,
                          event.target.value
                        )
                      }
                    >
                      <option value="new">
                        Nuovo
                      </option>

                      <option value="open">
                        In lavorazione
                      </option>

                      <option value="closed">
                        Chiuso
                      </option>
                    </select>
                  </div>

                  <div className="message-contact-row">
                    {email && (
                      <a
                        href={`mailto:${email}`}
                      >
                        <Mail size={14} />
                        {email}
                      </a>
                    )}

                    {phone && (
                      <a
                        href={`tel:${phone}`}
                      >
                        <Phone size={14} />
                        {phone}
                      </a>
                    )}

                    {phone && (
                      <a
                        href={whatsappLink(phone)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="message-body">
                    <span>Oggetto</span>
                    <h3>{subject}</h3>

                    <p>
                      {body ||
                        'Nessun testo nel messaggio.'}
                    </p>
                  </div>

                  <div className="message-notes">
                    <label>
                      Note interne
                    </label>

                    <textarea
                      rows="3"
                      className="input-ery"
                      placeholder="Aggiungi una nota..."
                      value={
                        message.admin_notes ?? ''
                      }
                      onChange={(event) =>
                        updateLocalMessage(
                          message.id,
                          'admin_notes',
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="save-note"
                      disabled={
                        workingId === message.id
                      }
                      onClick={() =>
                        saveNotes(message)
                      }
                    >
                      {workingId === message.id ? (
                        <>
                          <LoaderCircle className="spin" size={14} />
                          Salvataggio...
                        </>
                      ) : savedNoteId === message.id ? (
                        <>
                          <CheckCircle2 size={14} />
                          Nota salvata ✓
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Salva nota
                        </>
                      )}
                    </button>
                  </div>

                  <div className="message-actions">
                    <button
                      type="button"
                      disabled={
                        workingId === message.id
                      }
                      onClick={() =>
                        toggleRead(message)
                      }
                    >
                      {message.is_read ? (
                        <>
                          <EyeOff size={15} />
                          Segna non letto
                        </>
                      ) : (
                        <>
                          <Eye size={15} />
                          Segna letto
                        </>
                      )}
                    </button>

                    {email && (
                      <a
                        href={`mailto:${email}?subject=${encodeURIComponent(
                          `Re: ${subject}`
                        )}`}
                      >
                        <Mail size={15} />
                        Rispondi
                      </a>
                    )}

                    {phone && (
                      <a
                        href={whatsappLink(phone)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle size={15} />
                        WhatsApp
                      </a>
                    )}

                    <button
                      type="button"
                      className="delete-button"
                      disabled={
                        workingId === message.id
                      }
                      onClick={() =>
                        deleteMessage(message)
                      }
                    >
                      {workingId ===
                      message.id ? (
                        <LoaderCircle
                          size={15}
                          className="messages-spinner"
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
  .messages-page {
    min-height: 75vh;
    padding: 45px 0 90px;
  }

  .messages-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 25px;
    margin-bottom: 28px;
  }

  .messages-back {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    color: #85766f;
    font-size: 11px;
    text-decoration: none;
  }

  .messages-kicker {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
  }

  .messages-header h1 {
    margin: 3px 0 5px;
    color: #443731;
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px;
    font-weight: 500;
  }

  .messages-header p {
    margin: 0;
    color: #877a73;
    font-size: 12px;
  }

  .refresh-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .message-alert {
    margin-bottom: 18px;
    padding: 12px 15px;
    border-radius: 12px;
    font-size: 11px;
  }

  .message-alert.error {
    background: rgba(175,65,65,.08);
    color: #9d3e3e;
  }

  .message-alert.success {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .messages-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 22px;
  }

  .summary-card {
    min-width: 125px;
    padding: 12px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
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

  .messages-loading,
  .messages-empty {
    padding: 55px 20px;
    text-align: center;
    color: #8a7d76;
  }

  .messages-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .messages-empty {
    border: 1px dashed rgba(112,83,70,.18);
    border-radius: 20px;
  }

  .messages-empty svg {
    color: var(--terracotta);
  }

  .messages-empty h2 {
    margin: 12px 0 5px;
    color: #50443e;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
  }

  .messages-empty p {
    margin: 0;
    font-size: 11px;
  }

  .messages-list {
    display: grid;
    gap: 15px;
  }

  .message-card {
    padding: 22px;
    border: 1px solid rgba(112,83,70,.11);
    border-radius: 18px;
    background: white;
  }

  .message-card.unread {
    border-color: rgba(169,91,68,.25);
    box-shadow: 0 8px 28px rgba(73,54,45,.05);
  }

  .message-card-top {
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }

  .message-person {
    display: flex;
    gap: 11px;
  }

  .message-avatar {
    width: 39px;
    height: 39px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 50%;
    background: rgba(224,169,155,.15);
    color: var(--terracotta);
  }

  .message-badges {
    display: flex;
    gap: 5px;
  }

  .message-badges span {
    padding: 3px 7px;
    border-radius: 20px;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .new-badge {
    background: rgba(169,91,68,.10);
    color: var(--terracotta);
  }

  .closed-badge {
    background: rgba(99,132,92,.10);
    color: #55724f;
  }

  .message-card h2 {
    margin: 3px 0 1px;
    color: #4d413b;
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
  }

  .message-date {
    color: #9b9089;
    font-size: 9px;
  }

  .message-card-top select {
    height: 36px;
    padding: 0 10px;
    border: 1px solid rgba(112,83,70,.15);
    border-radius: 9px;
    background: white;
    color: #665a54;
    font-size: 10px;
  }

  .message-contact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }

  .message-contact-row a {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #7b6d66;
    font-size: 9px;
    text-decoration: none;
  }

  .message-body {
    margin-top: 17px;
    padding: 17px;
    border-radius: 13px;
    background: rgba(248,245,241,.75);
  }

  .message-body > span {
    color: var(--terracotta);
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .message-body h3 {
    margin: 3px 0 8px;
    color: #554943;
    font-size: 13px;
  }

  .message-body p {
    margin: 0;
    color: #71655f;
    font-size: 11px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .message-notes {
    margin-top: 15px;
  }

  .message-notes label {
    display: block;
    margin-bottom: 6px;
    color: #675b55;
    font-size: 9px;
    font-weight: 600;
  }

  .message-notes textarea {
    width: 100%;
    resize: vertical;
  }

  .save-note {
    margin-top: 7px;
  }

  .message-actions,
  .save-note {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .message-actions {
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(112,83,70,.08);
  }

  .message-actions button,
  .message-actions a,
  .save-note {
    min-height: 36px;
    padding: 0 10px;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(112,83,70,.13);
    border-radius: 9px;
    background: white;
    color: #6e6059;
    cursor: pointer;
    font-size: 9px;
    text-decoration: none;
  }

  .message-actions button,
  .message-actions a {
    display: flex;
    gap: 5px;
  }

  .delete-button {
    color: #a14d4d !important;
    border-color: rgba(175,65,65,.15) !important;
  }

  .messages-spinner {
    animation: messages-spin 1s linear infinite;
  }

  @keyframes messages-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
    .messages-header {
      align-items: stretch;
      flex-direction: column;
    }

    .refresh-button {
      width: 100%;
    }

    .message-card-top {
      flex-direction: column;
    }

    .message-card-top select {
      width: 100%;
    }

    .message-actions button,
    .message-actions a {
      flex: 1;
    }
  }
`

export default AdminMessages