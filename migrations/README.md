# Preparazione database (NON ESEGUITA)

Lo schema remoto e le policy RLS non sono disponibili. Revisionare prima `001_categories.sql`: aggiunge soltanto categorie mancanti, conserva dati esistenti e non presume vincoli univoci. Verificare tutte le colonne obbligatorie e gli eventuali vincoli aggiuntivi.

`configurator_assets.metadata` è già usato dal codice originale. Verificare che sia JSON/JSONB e che `type` accetti nuovi valori liberi; se è enum o CHECK, estenderlo dopo introspezione senza sostituire valori esistenti. Non viene applicata una migrazione alla cieca.

Metadati opzionali: keywords, synonyms, color, secondary_colors, material, size, diameter_cm, relative_size, semantic_role, recommended_position, compatible, incompatible, themes, tags. Liste come array o testo separato da virgole; oggetto JSON oppure stringa JSON accettati dal motore. Il ruolo guida il layout; tipi sconosciuti usano il posizionamento generico e la loro immagine reale.

## Listino da controllare in Admin (nessuna modifica remota eseguita)

Cerchi: 4 cm 2 €, 6 cm 2,50 €, 8 cm 3 €, 10 cm 4 €, 12 cm 5 €, 14 cm 6 €, 16 cm 7 €, 20 cm 8 €, 22 cm 9 €, 24 cm 10 €, 27 cm 12 €, 30 cm 15 €, 37 cm 18 €, 70 cm 30 €. Non ricaricare immagini né creare duplicati. Confrontare gli asset esistenti e segnalare duplicati prima di qualsiasi correzione.

Portachiavi 3 €, braccialetti 1,50 €, pendenti +0,50 €. Configurare i prezzi nei record reali, non nel parser. Confetti + bigliettino + bustina: un solo asset/extra composto con price_modifier 0,40 e keyword della frase completa; non tre extra da 0,40. Il motore riconosce la frase completa come un unico articolo se il record esiste. Nessuna immagine/record è inventata.

“Più cerchi -1€” resta da chiarire con Erika: nessuno sconto applicato.
