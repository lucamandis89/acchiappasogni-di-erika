VERSIONE WEB (Identica) - Acchiappasogni di Erika
------------------------------------------------
Questa cartella è pronta per GitHub + Netlify (static site).

Contenuto:
- index.html, styles.css, app.js
- data/config.json (numero WhatsApp + spedizione)
- data/products.json (prodotti)
- assets/images/... (foto HD)

COME OTTENERE IL LINK (GitHub + Netlify):
1) GitHub -> New repository (es. acchiappasogni-erika)
2) Carica TUTTI i file di questa cartella dentro il repo (Add file -> Upload files)
3) Netlify -> Add new site -> Import an existing project
4) Scegli GitHub e seleziona il repo
5) Build command: vuoto
6) Publish directory: .
7) Deploy -> avrai il link https://xxxx.netlify.app

Cambiare nome del sito:
Netlify -> Site settings -> Change site name.

DA LINK A APK:
- Crea un'APP WebView in Android Studio che punta al link Netlify
  (così ottieni APK identico al sito).
