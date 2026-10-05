# Acchiappasogni di Erika

Sito statico HTML/JavaScript. Il configuratore e il catalogo originali restano disponibili su `index.html` e `configuratore.html`.

## Sviluppo e verifiche

Con Node.js 24 e Python 3:

```sh
npm ci --ignore-scripts
npm run build
npm run lint
npm test
python3 -m http.server 8000 --bind 127.0.0.1 --directory .
```

La build crea `dist/` con il sito statico e valida JavaScript, script HTML e JSON. Non effettua deploy. ESLint verifica i nuovi moduli, gli script e i test; gli script legacy HTML sono controllati in build. La cache npm è in `/tmp`, perché nell'ambiente cloud la directory home può essere non scrivibile.

Con Python Playwright e Chromium già disponibili nell'ambiente, avvia il server come sopra e in un altro terminale esegui `python3 tests/browser-smoke.py`. Le fixture sono isolate nei browser di test e non modificano il catalogo reale. Il test usa `/usr/bin/chromium`.

## Crea dalla tua idea

`configuratore-idea.html` aggiunge interpretazione deterministica italiana, composizione multi-elemento, comandi successivi, editor manuale, dettagli Personalizzati, salvataggio locale e invio WhatsApp. Non utilizza API IA.

Il repository non include Supabase, Stripe, Edge Functions o un catalogo dei 14 cerchi. `data/configurator-assets.json` è perciò vuoto: non contiene elementi o immagini inventati. Il configuratore segnala le richieste non disponibili. Le fixture sotto `tests/` servono solo a verificare il motore, non vengono incluse in `dist/`.

## Catalogo e metadati

Da Admin esistente puoi aprire `admin-configuratore.html`, gestire gli asset nel browser, importare/esportare JSON. Il controllo password è locale, come quello già presente nel sito: non è autenticazione server. Le modifiche locali non sono condivise tra utenti. Per un catalogo pubblico, una persona autorizzata può revisionare il JSON esportato e aggiornare `data/configurator-assets.json` tramite una PR, oppure integrare un vero backend in un task successivo. Nessuna pubblicazione automatica è prevista.

Un asset contiene `id`, `name`, `type`, `image`, `price_modifier`, `active`, `order` e `metadata` opzionale. Il prezzo è in euro. Metadati:

- `keywords`, `synonyms`, `color`, `secondary_colors`, `material`, `measure`, `diameter_cm`;
- `relative_size`, `semantic_role`, `recommended_position`;
- `compatibility`, `incompatibility` (tipi o ID), `themes`, `meanings`, `tags`;
- `bundle_components`: nomi dei componenti di un extra unico, fatturato una sola volta quando tutti vengono richiesti.

I campi elenco sono array o stringhe separate da virgole. `metadata` può essere oggetto, JSON stringa o null. Vecchi asset senza metadati sono riconosciuti da nome/tipo e sinonimi del dominio. I nuovi tipi non richiedono modifiche al renderer: viene mostrata l'immagine dell'asset, con un'etichetta se manca. Per i cerchi usare `semantic_role: "ring"` e `diameter_cm`; il nome `Cerchio 30 cm` consente anche il fallback della misura. Posizioni: `center`, `below`, `above`, `left`, `right`, `sides`, `around`.

Il parser sceglie solo varianti attive che soddisfano colore, misura e materiale. Le richieste ambigue generano un chiarimento; non sono applicate varianti di colore inesistenti. L'intreccio richiesto viene conservato come dettaglio e nel riepilogo: non viene inventata una nuova variante dell'immagine. I temi e i significati noti nei metadati influenzano il punteggio di selezione. La compatibilità è un suggerimento; l'incompatibilità impedisce l'aggiunta del relativo asset.

Limiti: 100 elementi per singola richiesta, 250 per progetto, 4.000 caratteri nella descrizione, 50 istruzioni nella cronologia. Gli elementi fuori catalogo vengono segnalati; i dettagli sono conservati, ma non entrano nel totale. Il layout riduce uniformemente gli elementi automatici per mantenere proporzioni e area di lavoro. Le dimensioni manuali non alterano le misure commerciali o il prezzo.

I progetti nuovi usano `ae_intelligent_projects_v1`, senza cambiare gli archivi dei configuratori precedenti. Salva e WhatsApp aggiornano lo stesso ID; aprire WhatsApp non duplica il progetto. Nome, frase e dedica sono testo, non HTML. Il riepilogo conserva idea iniziale, ultima istruzione, componenti, testo, tema, significato, dettagli, totale e riferimento locale. Il JSON è scaricabile. La condivisione immagini del configuratore originale è conservata; la nuova pagina invia il riepilogo testuale.

## Categorie

Le categorie sono lette da `data/categories.json`, unite a quelle dei prodotti e a quelle create dall'Admin locale. Una nuova categoria non richiede modifiche al JavaScript. Non esistono tabelle Supabase da migrare nel repository.

Consulta `REPORT-FINALE.md` per risultati, immagini mancanti e limiti non verificabili.
