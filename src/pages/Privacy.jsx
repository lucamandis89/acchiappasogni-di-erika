import { Link } from 'react-router-dom'

function Privacy() {
  return (
    <main className="legal-page">
      <div className="container-ery legal-container">

        <div className="legal-header">
          <span className="legal-label">INFORMAZIONI LEGALI</span>
          <h1>Privacy Policy</h1>
          <p>
            Informativa sul trattamento dei dati personali degli utenti
            che visitano e utilizzano Gli Acchiappasogni di Ery.
          </p>
        </div>

        <div className="legal-content">

          <section>
            <h2>1. Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento dei dati personali raccolti
              attraverso questo sito è il gestore di
              <strong> Gli Acchiappasogni di Ery</strong>.
            </p>
            <p>
              Per qualsiasi richiesta relativa alla privacy e al
              trattamento dei dati personali è possibile utilizzare
              i recapiti presenti nella pagina{' '}
              <Link to="/contatti">Contatti</Link>.
            </p>
          </section>

          <section>
            <h2>2. Dati personali raccolti</h2>
            <p>
              Durante l'utilizzo del sito possono essere raccolti,
              a seconda dei servizi utilizzati, alcuni dati personali,
              tra cui:
            </p>

            <ul>
              <li>nome e cognome;</li>
              <li>indirizzo email;</li>
              <li>numero di telefono;</li>
              <li>indirizzo di spedizione;</li>
              <li>dati relativi agli ordini effettuati;</li>
              <li>
                informazioni fornite volontariamente attraverso
                moduli di contatto o richieste di personalizzazione;
              </li>
              <li>
                dati tecnici necessari al funzionamento e alla
                sicurezza del sito.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Finalità del trattamento</h2>
            <p>
              I dati personali possono essere utilizzati esclusivamente
              per finalità connesse ai servizi offerti dal sito, tra cui:
            </p>

            <ul>
              <li>creazione e gestione dell'account;</li>
              <li>gestione del carrello e degli ordini;</li>
              <li>gestione dei pagamenti;</li>
              <li>preparazione e spedizione degli acquisti;</li>
              <li>
                gestione delle richieste relative a prodotti
                personalizzati;
              </li>
              <li>assistenza al cliente;</li>
              <li>gestione di richieste inviate tramite il sito;</li>
              <li>
                adempimento di eventuali obblighi amministrativi,
                fiscali e di legge;
              </li>
              <li>
                prevenzione di utilizzi fraudolenti o non autorizzati
                dei servizi.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Base giuridica del trattamento</h2>
            <p>
              Il trattamento dei dati avviene, a seconda dei casi,
              perché necessario all'esecuzione di un contratto o di
              misure precontrattuali richieste dall'utente, per
              adempiere a obblighi di legge, sulla base del consenso
              quando richiesto oppure per il perseguimento di legittimi
              interessi compatibili con i diritti degli utenti.
            </p>
          </section>

          <section>
            <h2>5. Pagamenti</h2>
            <p>
              I pagamenti online possono essere gestiti tramite
              <strong> Stripe</strong>.
            </p>
            <p>
              I dati completi della carta di pagamento non vengono
              memorizzati direttamente dal sito. Le informazioni
              necessarie all'elaborazione del pagamento vengono gestite
              dal fornitore del servizio di pagamento secondo le proprie
              misure di sicurezza e la propria informativa privacy.
            </p>
          </section>

          <section>
            <h2>6. Servizi tecnici e conservazione dei dati</h2>
            <p>
              Per il funzionamento del negozio online possono essere
              utilizzati fornitori esterni di servizi tecnologici,
              hosting, database, autenticazione, archiviazione,
              pagamento e altri servizi necessari al funzionamento
              del sito.
            </p>
            <p>
              I dati vengono conservati per il tempo necessario alle
              finalità per cui sono stati raccolti e, quando previsto,
              per i periodi richiesti dalla normativa applicabile.
            </p>
          </section>

          <section>
            <h2>7. Comunicazione dei dati</h2>
            <p>
              I dati personali non vengono venduti. Possono essere
              comunicati esclusivamente ai soggetti che devono
              trattarli per consentire l'erogazione dei servizi,
              come fornitori tecnologici, servizi di pagamento,
              eventuali servizi di spedizione e soggetti ai quali
              la comunicazione sia richiesta dalla legge.
            </p>
          </section>

          <section>
            <h2>8. Account e autenticazione</h2>
            <p>
              Gli utenti possono creare un account per accedere alle
              funzionalità riservate del sito. Le credenziali devono
              essere conservate con cura e non devono essere condivise
              con altre persone.
            </p>
          </section>

          <section>
            <h2>9. Diritti dell'interessato</h2>
            <p>
              Nei casi previsti dal Regolamento (UE) 2016/679
              (GDPR), l'interessato può esercitare i propri diritti,
              tra cui:
            </p>

            <ul>
              <li>ottenere informazioni sui propri dati personali;</li>
              <li>chiederne l'accesso;</li>
              <li>richiederne la rettifica;</li>
              <li>richiederne la cancellazione, quando applicabile;</li>
              <li>richiedere la limitazione del trattamento;</li>
              <li>opporsi al trattamento nei casi previsti;</li>
              <li>
                richiedere la portabilità dei dati quando applicabile;
              </li>
              <li>
                revocare il consenso quando il trattamento è basato
                sul consenso.
              </li>
            </ul>

            <p>
              L'interessato ha inoltre il diritto di proporre reclamo
              all'autorità di controllo competente.
            </p>
          </section>

          <section>
            <h2>10. Sicurezza</h2>
            <p>
              Sono adottate misure tecniche e organizzative finalizzate
              a proteggere i dati personali da accessi non autorizzati,
              perdita, alterazione o divulgazione indebita.
            </p>
          </section>

          <section>
            <h2>11. Cookie</h2>
            <p>
              Il sito può utilizzare cookie e tecnologie analoghe
              necessarie al proprio funzionamento e, quando presenti,
              ulteriori strumenti soggetti alle condizioni previste
              dalla normativa applicabile.
            </p>

            <p>
              Per maggiori informazioni consulta la{' '}
              <Link to="/cookie">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2>12. Modifiche alla Privacy Policy</h2>
            <p>
              Questa informativa può essere aggiornata per adeguarla
              a modifiche del sito, dei servizi utilizzati o della
              normativa applicabile. La versione aggiornata sarà
              pubblicata in questa pagina.
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

export default Privacy