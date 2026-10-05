import { Link } from 'react-router-dom'

function Cookie() {
  return (
    <main className="legal-page">
      <div className="container-ery legal-container">

        <div className="legal-header">
          <span className="legal-label">
            INFORMAZIONI LEGALI
          </span>

          <h1>Cookie Policy</h1>

          <p>
            Informazioni sull'utilizzo di cookie e tecnologie
            analoghe nel sito Gli Acchiappasogni di Ery.
          </p>
        </div>

        <div className="legal-content">

          <section>
            <h2>1. Cosa sono i cookie</h2>

            <p>
              I cookie sono piccoli file di testo che possono essere
              memorizzati sul dispositivo dell'utente durante la
              navigazione di un sito web.
            </p>

            <p>
              Possono essere utilizzati per consentire il corretto
              funzionamento del sito, mantenere alcune preferenze,
              gestire sessioni e autenticazione oppure fornire
              determinate funzionalità.
            </p>
          </section>

          <section>
            <h2>2. Cookie tecnici e necessari</h2>

            <p>
              Il sito può utilizzare cookie o tecnologie equivalenti
              strettamente necessari per consentire il funzionamento
              del negozio online e dei servizi richiesti dall'utente.
            </p>

            <p>
              Questi strumenti possono essere necessari, ad esempio,
              per:
            </p>

            <ul>
              <li>gestire la sessione dell'utente;</li>
              <li>consentire l'accesso all'account;</li>
              <li>mantenere il corretto funzionamento del sito;</li>
              <li>garantire sicurezza e prevenire abusi;</li>
              <li>
                gestire alcune funzionalità necessarie durante
                l'acquisto.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Carrello</h2>

            <p>
              Il sito può utilizzare la memoria locale del browser
              (localStorage) per conservare temporaneamente le
              informazioni relative ai prodotti inseriti nel carrello.
            </p>

            <p>
              Questo permette, ad esempio, di ritrovare il contenuto
              del carrello durante la navigazione o dopo aver
              ricaricato la pagina.
            </p>
          </section>

          <section>
            <h2>4. Autenticazione</h2>

            <p>
              Per la gestione degli account e delle sessioni di accesso
              possono essere utilizzate tecnologie necessarie a
              riconoscere in modo sicuro l'utente autenticato.
            </p>

            <p>
              Questi strumenti sono necessari per permettere
              l'accesso alle funzionalità riservate, come l'area
              personale e i preferiti.
            </p>
          </section>

          <section>
            <h2>5. Pagamenti</h2>

            <p>
              Per i pagamenti online il sito può utilizzare servizi
              forniti da <strong>Stripe</strong>.
            </p>

            <p>
              Durante la procedura di pagamento Stripe può utilizzare
              cookie o tecnologie analoghe necessari alla sicurezza,
              alla prevenzione delle frodi e all'elaborazione della
              transazione.
            </p>
          </section>

          <section>
            <h2>6. Cookie di terze parti</h2>

            <p>
              Alcune funzionalità del sito possono dipendere da
              servizi forniti da soggetti terzi.
            </p>

            <p>
              Tali soggetti possono utilizzare propri strumenti
              tecnici secondo le rispettive informative privacy e
              cookie.
            </p>
          </section>

          <section>
            <h2>7. Cookie analitici e di marketing</h2>

            <p>
              Eventuali strumenti analitici, pubblicitari o di
              marketing non strettamente necessari devono essere
              utilizzati nel rispetto della normativa applicabile.
            </p>

            <p>
              Qualora in futuro vengano introdotti strumenti che
              richiedono il consenso preventivo dell'utente, il sito
              dovrà permettere di accettarli o rifiutarli prima della
              loro attivazione.
            </p>
          </section>

          <section>
            <h2>8. Gestione tramite browser</h2>

            <p>
              L'utente può gestire o eliminare i cookie utilizzando
              le impostazioni del proprio browser.
            </p>

            <p>
              La disattivazione di strumenti tecnici strettamente
              necessari potrebbe tuttavia impedire il corretto
              funzionamento di alcune parti del sito.
            </p>
          </section>

          <section>
            <h2>9. Protezione dei dati personali</h2>

            <p>
              Per maggiori informazioni sul trattamento dei dati
              personali, sulle finalità del trattamento e sui diritti
              dell'utente è possibile consultare la{' '}
              <Link to="/privacy">
                Privacy Policy
              </Link>.
            </p>
          </section>

          <section>
            <h2>10. Modifiche alla Cookie Policy</h2>

            <p>
              Questa Cookie Policy può essere aggiornata in seguito
              a modifiche delle funzionalità del sito, dei servizi
              utilizzati o della normativa applicabile.
            </p>

            <p>
              La versione aggiornata sarà pubblicata in questa pagina.
            </p>
          </section>

          <div className="legal-update">
            Ultimo aggiornamento: ottobre 2026
          </div>

        </div>
      </div>

      <style>{`
        .legal-page {
          min-height: 70vh;
          padding: 70px 20px 90px;
          background: #fdfbf8;
        }

        .legal-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .legal-header {
          text-align: center;
          margin-bottom: 55px;
        }

        .legal-label {
          display: block;
          margin-bottom: 12px;
          color: #9a6252;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .legal-header h1 {
          margin: 0 0 15px;
          color: #493b35;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(42px, 6vw, 60px);
          font-weight: 500;
        }

        .legal-header p {
          max-width: 650px;
          margin: 0 auto;
          color: #766a64;
          font-size: 14px;
          line-height: 1.8;
        }

        .legal-content {
          padding: 45px;
          background: #fff;
          border: 1px solid #eee7e2;
          border-radius: 20px;
          box-shadow: 0 8px 35px rgba(73, 59, 53, .05);
        }

        .legal-content section {
          margin-bottom: 38px;
        }

        .legal-content section:last-of-type {
          margin-bottom: 20px;
        }

        .legal-content h2 {
          margin: 0 0 13px;
          color: #493b35;
          font-family: 'Cormorant Garamond', serif;
          font-size: 25px;
          font-weight: 600;
        }

        .legal-content p,
        .legal-content li {
          color: #665c57;
          font-size: 13px;
          line-height: 1.9;
        }

        .legal-content p {
          margin: 0 0 12px;
        }

        .legal-content ul {
          margin: 12px 0;
          padding-left: 22px;
        }

        .legal-content li {
          margin-bottom: 5px;
        }

        .legal-content a {
          color: #9a6252;
          font-weight: 600;
          text-decoration: none;
        }

        .legal-content a:hover {
          text-decoration: underline;
        }

        .legal-update {
          padding-top: 25px;
          border-top: 1px solid #eee7e2;
          color: #9b918c;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 600px) {
          .legal-page {
            padding: 45px 15px 65px;
          }

          .legal-header {
            margin-bottom: 35px;
          }

          .legal-content {
            padding: 28px 20px;
            border-radius: 15px;
          }

          .legal-content h2 {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  )
}

export default Cookie