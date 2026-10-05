import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuovo' },
  { value: 'contacted', label: 'Contattato' },
  { value: 'in_progress', label: 'In lavorazione' },
  { value: 'approved', label: 'Approvato' },
  { value: 'completed', label: 'Completato' },
  { value: 'cancelled', label: 'Annullato' },
]

function getStatusLabel(status) {
  return (
    STATUS_OPTIONS.find(
      (item) => item.value === status
    )?.label || status || 'Nuovo'
  )
}

function formatDate(value) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function formatMoney(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Non indicato'
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 'Non indicato'
  }

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(number)
}

function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('all')
  const [savingId, setSavingId] =
    useState(null)

  async function loadProjects() {
    setLoading(true)
    setError('')

    const { data, error: loadError } =
      await supabase
        .from('custom_projects')
        .select('*')
        .order('created_at', {
          ascending: false,
        })

    if (loadError) {
      console.error(loadError)
      setError(
        'Non è stato possibile caricare i progetti.'
      )
      setProjects([])
    } else {
      setProjects(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function updateLocalProject(
    id,
    field,
    value
  ) {
    setProjects((current) =>
      current.map((project) =>
        project.id === id
          ? {
              ...project,
              [field]: value,
            }
          : project
      )
    )
  }

  async function saveProject(project) {
    setSavingId(project.id)
    setError('')

    const { error: saveError } =
      await supabase
        .from('custom_projects')
        .update({
          status: project.status || 'new',
          admin_notes:
            project.admin_notes?.trim() ||
            null,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', project.id)

    if (saveError) {
      console.error(saveError)
      setError(
        'Errore durante il salvataggio del progetto.'
      )
    }

    setSavingId(null)
  }

  async function deleteProject(project) {
    const confirmed = window.confirm(
      `Eliminare definitivamente la richiesta di ${
        project.customer_name ||
        'questo cliente'
      }?`
    )

    if (!confirmed) return

    setError('')

    const { error: deleteError } =
      await supabase
        .from('custom_projects')
        .delete()
        .eq('id', project.id)

    if (deleteError) {
      console.error(deleteError)
      setError(
        'Non è stato possibile eliminare la richiesta.'
      )
      return
    }

    setProjects((current) =>
      current.filter(
        (item) => item.id !== project.id
      )
    )
  }

  const filteredProjects = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase()

    return projects.filter((project) => {
      if (
        statusFilter !== 'all' &&
        project.status !== statusFilter
      ) {
        return false
      }

      if (!term) return true

      const searchable = [
        project.customer_name,
        project.customer_email,
        project.customer_phone,
        project.title,
        project.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(term)
    })
  }, [
    projects,
    search,
    statusFilter,
  ])

  const newCount = projects.filter(
    (project) =>
      project.status === 'new'
  ).length

  const activeCount = projects.filter(
    (project) =>
      ![
        'completed',
        'cancelled',
      ].includes(project.status)
  ).length

  return (
    <main className="projects-admin">
      <div className="projects-container">
        <div className="projects-topbar">
          <Link
            to="/admin"
            className="projects-back"
          >
            <ArrowLeft size={17} />
            Admin
          </Link>

          <button
            type="button"
            className="projects-refresh"
            onClick={loadProjects}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? 'projects-spin'
                  : ''
              }
            />
            Aggiorna
          </button>
        </div>

        <div className="projects-heading">
          <div>
            <span className="projects-kicker">
              Area amministrazione
            </span>

            <h1>
              Progetti personalizzati
            </h1>

            <p>
              Gestisci le richieste inviate
              dai clienti.
            </p>
          </div>

          <div className="projects-stats">
            <div>
              <strong>
                {projects.length}
              </strong>
              <span>Totali</span>
            </div>

            <div>
              <strong>{newCount}</strong>
              <span>Nuovi</span>
            </div>

            <div>
              <strong>
                {activeCount}
              </strong>
              <span>Attivi</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="projects-error">
            {error}
          </div>
        )}

        <div className="projects-filters">
          <div className="projects-search">
            <Search size={17} />

            <input
              type="search"
              placeholder="Cerca cliente, email o progetto..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              Tutti gli stati
            </option>

            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>

        {loading ? (
          <div className="projects-empty">
            <RefreshCw
              size={28}
              className="projects-spin"
            />
            <p>
              Caricamento progetti...
            </p>
          </div>
        ) : filteredProjects.length ===
          0 ? (
          <div className="projects-empty">
            <Clock3 size={30} />

            <h2>
              Nessun progetto trovato
            </h2>

            <p>
              Le nuove richieste dei
              clienti compariranno qui.
            </p>
          </div>
        ) : (
          <div className="projects-list">
            {filteredProjects.map(
              (project) => {
                const whatsappNumber =
                  String(
                    project.customer_phone ||
                      ''
                  ).replace(/\D/g, '')

                return (
                  <article
                    className="project-card"
                    key={project.id}
                  >
                    <div className="project-card-head">
                      <div>
                        <div className="project-title-line">
                          <h2>
                            {project.title ||
                              'Progetto personalizzato'}
                          </h2>

                          <span
                            className={`project-status status-${project.status || 'new'}`}
                          >
                            {getStatusLabel(
                              project.status
                            )}
                          </span>
                        </div>

                        <p className="project-date">
                          Ricevuto il{' '}
                          {formatDate(
                            project.created_at
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="project-delete"
                        title="Elimina richiesta"
                        onClick={() =>
                          deleteProject(
                            project
                          )
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="project-grid">
                      <section>
                        <h3>Cliente</h3>

                        <strong className="project-customer">
                          {project.customer_name}
                        </strong>

                        <div className="project-contact-list">
                          <a
                            href={`mailto:${project.customer_email}`}
                          >
                            <Mail size={15} />
                            {
                              project.customer_email
                            }
                          </a>

                          {project.customer_phone && (
                            <a
                              href={`tel:${project.customer_phone}`}
                            >
                              <Phone
                                size={15}
                              />
                              {
                                project.customer_phone
                              }
                            </a>
                          )}

                          {whatsappNumber && (
                            <a
                              href={`https://wa.me/${whatsappNumber}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle
                                size={15}
                              />
                              WhatsApp
                              <ExternalLink
                                size={12}
                              />
                            </a>
                          )}
                        </div>
                      </section>

                      <section>
                        <h3>
                          Budget indicativo
                        </h3>

                        <div className="project-budget">
                          {formatMoney(
                            project.budget
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="project-description">
                      <h3>
                        Richiesta del cliente
                      </h3>

                      <p>
                        {project.description ||
                          'Nessuna descrizione.'}
                      </p>
                    </div>

                    {Array.isArray(
                      project.images
                    ) &&
                      project.images.length >
                        0 && (
                        <div className="project-images">
                          <h3>
                            Immagini allegate
                          </h3>

                          <div className="project-image-grid">
                            {project.images.map(
                              (
                                image,
                                index
                              ) => (
                                <a
                                  href={image}
                                  target="_blank"
                                  rel="noreferrer"
                                  key={`${image}-${index}`}
                                >
                                  <img
                                    src={image}
                                    alt={`Allegato ${
                                      index +
                                      1
                                    }`}
                                  />
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    <div className="project-management">
                      <label>
                        <span>Stato</span>

                        <select
                          value={
                            project.status ||
                            'new'
                          }
                          onChange={(
                            event
                          ) =>
                            updateLocalProject(
                              project.id,
                              'status',
                              event.target
                                .value
                            )
                          }
                        >
                          {STATUS_OPTIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label className="project-notes">
                        <span>
                          Note private di Erika
                        </span>

                        <textarea
                          rows="4"
                          placeholder="Misure, colori concordati, prezzo, dettagli da ricordare..."
                          value={
                            project.admin_notes ||
                            ''
                          }
                          onChange={(
                            event
                          ) =>
                            updateLocalProject(
                              project.id,
                              'admin_notes',
                              event.target
                                .value
                            )
                          }
                        />
                      </label>

                      <button
                        type="button"
                        className="project-save"
                        disabled={
                          savingId ===
                          project.id
                        }
                        onClick={() =>
                          saveProject(
                            project
                          )
                        }
                      >
                        {savingId ===
                        project.id ? (
                          <>
                            <RefreshCw
                              size={16}
                              className="projects-spin"
                            />
                            Salvataggio...
                          </>
                        ) : (
                          <>
                            <Save
                              size={16}
                            />
                            Salva modifiche
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                )
              }
            )}
          </div>
        )}
      </div>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .projects-admin {
    min-height: 100vh;
    padding: 38px 0 80px;
    background: #f8f5f2;
    color: #493d37;
  }

  .projects-container {
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
  }

  .projects-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-bottom: 32px;
  }

  .projects-back,
  .projects-refresh {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #6f5c53;
    font-size: 12px;
    text-decoration: none;
  }

  .projects-refresh {
    padding: 9px 13px;
    border: 1px solid #ded4ce;
    border-radius: 9px;
    background: white;
    cursor: pointer;
  }

  .projects-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 30px;
    margin-bottom: 30px;
  }

  .projects-kicker {
    color: #8f5848;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .projects-heading h1 {
    margin: 5px 0 6px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 43px;
    font-weight: 500;
  }

  .projects-heading p {
    margin: 0;
    color: #877a73;
    font-size: 11px;
  }

  .projects-stats {
    display: flex;
    gap: 8px;
  }

  .projects-stats > div {
    min-width: 78px;
    padding: 12px 15px;
    text-align: center;
    border: 1px solid #e4dad4;
    border-radius: 12px;
    background: white;
  }

  .projects-stats strong {
    display: block;
    font-size: 20px;
  }

  .projects-stats span {
    color: #95877f;
    font-size: 8px;
    text-transform: uppercase;
  }

  .projects-error {
    margin-bottom: 20px;
    padding: 13px 16px;
    border-radius: 10px;
    background: #fbeaea;
    color: #a03d3d;
    font-size: 11px;
  }

  .projects-filters {
    display: grid;
    grid-template-columns: 1fr 190px;
    gap: 12px;
    margin-bottom: 22px;
  }

  .projects-search {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 13px;
    border: 1px solid #ded4ce;
    border-radius: 11px;
    background: white;
    color: #9a8b83;
  }

  .projects-search input {
    width: 100%;
    min-height: 43px;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
    font-size: 11px;
  }

  .projects-filters select,
  .project-management select,
  .project-management textarea {
    width: 100%;
    border: 1px solid #ded4ce;
    border-radius: 10px;
    background: white;
    color: #554943;
    font: inherit;
  }

  .projects-filters select {
    padding: 0 12px;
    min-height: 43px;
    font-size: 10px;
  }

  .projects-list {
    display: grid;
    gap: 18px;
  }

  .project-card {
    padding: 25px;
    border: 1px solid #e5dcd6;
    border-radius: 18px;
    background: white;
    box-shadow: 0 8px 30px rgba(73,54,45,.035);
  }

  .project-card-head {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding-bottom: 18px;
    border-bottom: 1px solid #eee7e2;
  }

  .project-title-line {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .project-title-line h2 {
    margin: 0;
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
  }

  .project-status {
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .status-new {
    background: #f8e9d8;
    color: #9a622b;
  }

  .status-contacted {
    background: #e7eef8;
    color: #4e6e9a;
  }

  .status-in_progress {
    background: #eee8f8;
    color: #725a9d;
  }

  .status-approved {
    background: #e4f1e2;
    color: #557b50;
  }

  .status-completed {
    background: #e1f1ec;
    color: #39725f;
  }

  .status-cancelled {
    background: #f3e5e5;
    color: #985252;
  }

  .project-date {
    margin: 5px 0 0;
    color: #9b8e87;
    font-size: 9px;
  }

  .project-delete {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border: 1px solid #eadbdb;
    border-radius: 9px;
    background: #fffafa;
    color: #a95b5b;
    cursor: pointer;
  }

  .project-grid {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 30px;
    padding: 22px 0;
  }

  .project-card h3 {
    margin: 0 0 8px;
    color: #9a8a82;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .project-customer {
    display: block;
    margin-bottom: 9px;
    font-size: 13px;
  }

  .project-contact-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
  }

  .project-contact-list a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #77584d;
    font-size: 10px;
    text-decoration: none;
  }

  .project-budget {
    font-family: 'Cormorant Garamond', serif;
    font-size: 25px;
    font-weight: 600;
    color: #8b5545;
  }

  .project-description {
    padding: 18px;
    border-radius: 12px;
    background: #faf7f4;
  }

  .project-description p {
    margin: 0;
    white-space: pre-wrap;
    color: #665a54;
    font-size: 11px;
    line-height: 1.75;
  }

  .project-images {
    margin-top: 20px;
  }

  .project-image-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .project-image-grid img {
    width: 95px;
    height: 95px;
    object-fit: cover;
    border-radius: 10px;
  }

  .project-management {
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid #eee7e2;
  }

  .project-management label {
    display: block;
    margin-bottom: 14px;
  }

  .project-management label > span {
    display: block;
    margin-bottom: 6px;
    color: #6e6059;
    font-size: 9px;
    font-weight: 600;
  }

  .project-management select {
    max-width: 250px;
    min-height: 40px;
    padding: 0 11px;
    font-size: 10px;
  }

  .project-management textarea {
    min-height: 90px;
    padding: 11px;
    resize: vertical;
    font-size: 10px;
    line-height: 1.6;
  }

  .project-save {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 40px;
    padding: 0 16px;
    border: 0;
    border-radius: 9px;
    background: #8b5545;
    color: white;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
  }

  .project-save:disabled {
    opacity: .6;
    cursor: wait;
  }

  .projects-empty {
    min-height: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ddd1ca;
    border-radius: 16px;
    background: white;
    color: #94867f;
    text-align: center;
  }

  .projects-empty h2 {
    margin: 10px 0 3px;
    font-family: 'Cormorant Garamond', serif;
    color: #62554e;
  }

  .projects-empty p {
    font-size: 10px;
  }

  .projects-spin {
    animation: projects-spin 1s linear infinite;
  }

  @keyframes projects-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    .projects-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .projects-stats {
      width: 100%;
    }

    .projects-stats > div {
      flex: 1;
      min-width: 0;
    }

    .projects-filters,
    .project-grid {
      grid-template-columns: 1fr;
    }

    .project-card {
      padding: 18px;
    }

    .project-management select {
      max-width: none;
    }
  }

  @media (max-width: 480px) {
    .projects-container {
      width: min(100% - 20px, 1180px);
    }

    .projects-heading h1 {
      font-size: 35px;
    }

    .projects-stats > div {
      padding: 10px 7px;
    }
  }
`

export default AdminProjects