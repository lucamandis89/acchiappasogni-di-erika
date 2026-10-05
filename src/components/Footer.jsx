import { Link } from 'react-router-dom'

function Footer() {
  const year = new Date().getFullYear()

  const instagramUrl =
    'https://www.instagram.com/acchiappasogni_ery/'

  const facebookUrl =
    'https://www.facebook.com/Acchiappasognieri'

  const whatsappUrl =
    'https://wa.me/393440260906?text=' +
    encodeURIComponent(
      'Ciao Erika! Ti contatto dal sito Gli Acchiappasogni di Ery. Vorrei avere alcune informazioni.'
    )

  const openExternal = (url) => {
    window.location.href = url
  }

  return (
    <footer className="ery-footer">
      <div className="container-ery footer-grid">
        <div className="footer-brand">
          <h2>Gli Acchiappasogni di Ery</h2>

          <p>
            Creazioni fatte a mano,
            intrecciate con cura, passione e un pizzico
            di magia.
          </p>

          <div className="footer-social">
            <button
              type="button"
              onClick={() => openExternal(instagramUrl)}
              aria-label="Instagram"
              title="Instagram"
              className="social-letter social-button"
            >
              IG
            </button>

            <button
              type="button"
              onClick={() => openExternal(facebookUrl)}
              aria-label="Facebook"
              title="Facebook"
              className="social-letter social-button"
            >
              f
            </button>
          </div>
        </div>

        <div className="footer-column">
          <h3>Esplora</h3>

          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/configuratore">
            Crea il tuo acchiappasogni
          </Link>
          <Link to="/personalizzati">
            Personalizzati
          </Link>
          <Link to="/chi-siamo">
            Chi siamo
          </Link>
        </div>

        <div className="footer-column">
          <h3>Assistenza</h3>

          <Link to="/faq">
            Domande frequenti
          </Link>
          <Link to="/contatti">
            Contatti
          </Link>
          <Link to="/account">
            Il mio account
          </Link>
          <Link to="/preferiti">
            I miei preferiti
          </Link>
        </div>

        <div className="footer-column">
          <h3>Contatti</h3>

          <Link
            to="/contatti"
            className="footer-contact"
          >
            <span className="contact-symbol">✉</span>
            Scrivici
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-contact"
          >
            <span className="contact-symbol">◉</span>
            WhatsApp
          </a>

          <p className="footer-small">
            Per informazioni, personalizzazioni
            e richieste speciali siamo a tua
            disposizione.
          </p>
        </div>
      </div>

      <div className="container-ery footer-divider" />

      <div className="container-ery footer-bottom">
        <p>
          © {year} Gli Acchiappasogni di Ery
        </p>

        <p className="footer-made">
          Fatto a mano con
          <span className="footer-heart">♥</span>
        </p>

        <div className="footer-legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/cookie">Cookie</Link>
          <Link to="/termini">
            Termini e condizioni
          </Link>
        </div>
      </div>

      <style>{`
        .ery-footer {
          position: relative;
          z-index: 10;
          margin-top: auto;
          padding: 65px 0 25px;
          background: #493b35;
          color: rgba(255,255,255,.78);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.1fr;
          gap: 50px;
        }

        .footer-brand h2 {
          margin: 0 0 15px;
          color: #fff;
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 500;
        }

        .footer-brand p {
          max-width: 330px;
          margin: 0;
          font-size: 12px;
          line-height: 1.8;
        }

        .footer-social {
          position: relative;
          z-index: 20;
          display: flex;
          gap: 9px;
          margin-top: 22px;
        }

        .social-button {
          position: relative;
          z-index: 21;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 50%;
          background: transparent;
          color: #fff;
          cursor: pointer;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          transition: .2s ease;
        }

        .social-button:hover {
          background: rgba(255,255,255,.1);
          transform: translateY(-2px);
        }

        .social-letter {
          font-family: Arial, sans-serif;
          font-size: 15px;
          font-weight: 700;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .footer-column h3 {
          margin: 0 0 8px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
        }

        .footer-column a {
          color: rgba(255,255,255,.72);
          font-size: 12px;
          text-decoration: none;
          transition: color .2s ease;
        }

        .footer-column a:hover {
          color: #fff;
        }

        .footer-contact {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .contact-symbol {
          width: 17px;
          display: inline-flex;
          justify-content: center;
          color: #e1aa9d;
          font-size: 15px;
        }

        .footer-small {
          margin: 5px 0 0;
          font-size: 11px;
          line-height: 1.7;
          color: rgba(255,255,255,.55);
        }

        .footer-divider {
          height: 1px;
          margin-top: 48px;
          background: rgba(255,255,255,.12);
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding-top: 22px;
          font-size: 10px;
          color: rgba(255,255,255,.5);
        }

        .footer-bottom p {
          margin: 0;
        }

        .footer-made {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .footer-heart {
          color: #e1aa9d;
          font-size: 15px;
          line-height: 1;
        }

        .footer-legal {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 17px;
        }

        .footer-legal a {
          color: rgba(255,255,255,.5);
          text-decoration: none;
        }

        .footer-legal a:hover {
          color: #fff;
        }

        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .ery-footer {
            padding-top: 50px;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .footer-divider {
            margin-top: 38px;
          }

          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-legal {
            justify-content: flex-start;
          }
        }
      `}</style>
    </footer>
  )
}

export default Footer