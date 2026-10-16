# AGENTS.md - frontend Buona Caccia

Registro vivo delle decisioni. Si aggiorna a ogni passo, con il perche'. Le decisioni superate si barrano.

## 1. Contesto

Frontend del progetto di tesi "Buona Caccia" (iscrizioni agli eventi AGESCI). Il backend e' in CatBonzo/Buoncaccia-be e ha il suo AGENTS.md; il diario della tesi del frontend e' qui in `docs/tesi/diario-frontend.txt` (richiesto da Mahima il 2026-10-16), quello del backend resta in `docs/tesi/diario-capitolo-3.txt`. Il frontend serve soprattutto a provare le API sul serio: ogni attrito col contratto si annota qui sotto e si corregge nel backend.

## 2. Regole di lavoro

- Lingua dell'interfaccia: italiano, pensata prima per il telefono.
- Un ramo `NNN-nome` e una pull request verso `feature` per fase; il merge lo fa solo Mahima.
- A ogni passo si scrive una voce in `docs/tesi/diario-frontend.txt` (Cosa/Chi/Paradigma/Artefatti/Problemi/Spunto), prima di aprire o aggiornare la PR.
- Test prima: unitari con Vitest, scenari con Playwright contro il backend vero. Non si apre la PR con test rossi.
- Versioni: sempre le ultime stabili.
- Il client in `src/app/api` e' generato dall'OpenAPI e non si tocca; se il contratto non va, si cambia il backend.
- Nessun permesso e' dedotto dal ruolo: l'interfaccia mostra solo cio' che il token consente, ma l'ultima parola e' del backend.

## 3. Decisioni

| Data | Decisione | Perche' |
|---|---|---|
| 2026-10-16 | Angular 22, componenti standalone con signal, Angular Material | Ultima versione stabile; Material da' accessibilita' e mobile senza costruirli |
| 2026-10-16 | Client TypeScript generato con ng-openapi-gen da `openapi/buonacaccia.json` (`npm run api:sync`) | Il contratto resta una sola fonte e ogni cambio del backend si vede nella compilazione |
| 2026-10-16 | Accesso di prova: si sceglie un utente di `/api/v1/mock/auth/findAll`; il token Bearer sta in sessionStorage | Il backend ha solo il mock; Keycloak arriva dopo e sostituira' solo `SessionService` e la pagina di login |
| 2026-10-16 | Menu e guardie per permesso (`evento:gestione`...), non per ruolo | Nel backend i permessi sono le entitlement del token, il ruolo dice solo cosa si vede |
| 2026-10-16 | Errori: ogni risposta di errore diventa `ApiError` (envelope); 401 con sessione = ritorno al login, 0 e 5xx = avviso; 409/422 li mostra la pagina | Un solo modo di leggere errorCode e campo; gli errori di dominio hanno bisogno del contesto del modulo |
| 2026-10-16 | Il catalogo (`/eventi`, `/eventi/:id`) e' pubblico; la barra mostra "Accedi" a chi non e' entrato; solo `/profilo` e le sezioni di gestione chiedono il login | La specifica vuole la ricerca senza accesso; il backend la espone pubblica |
| 2026-10-16 | Locale `it` registrato in `app.config.ts` | Senza, date e valuta andavano in errore a runtime (NG0701), visibile solo in un browser vero |
| 2026-10-16 | Gli scenari e2e creano da soli i propri eventi con titolo unico (`e2e/api.ts`) | Non dipendono dallo stato del database e si possono rilanciare |
| 2026-10-16 | Il pulsante Ritira dipende da `availableActions` della risposta, non da regole copiate nel frontend | Le regole di ritiro (data di partenza, chi e' titolare) vivono nel backend; NFR-12 |
| 2026-10-16 | Conferma del ritiro in linea nella scheda, senza finestra di dialogo | Piu' semplice e accessibile su telefono; il ritiro e' reversibile solo rifacendo l'iscrizione, quindi la conferma resta |
| 2026-10-16 | Il download dei documenti usa HttpClient con risposta Blob (`core/document-download.ts`), non il client generato | Il contratto dichiara il contenuto come testo JSON: il client generato non puo' scaricare un file |
| 2026-10-16 | La scheda si invia salvando prima le risposte a schermo | Cosi' un invio non perde quanto scritto dopo l'ultimo salvataggio |
| 2026-10-16 | Gli errori della scheda arrivano con chiave `answers.<id>` e si mostrano sotto la domanda giusta | La persona vede subito cosa correggere |
| 2026-10-16 | Diario della tesi del frontend nel repository del frontend, separato da quello del backend | Mahima lo ha chiesto: ogni parte tiene traccia del proprio sviluppo, per il capitolo 3 |
| 2026-10-16 | Playwright contro il backend vero, non contro finti | Scopo del frontend e' provare le API: un finto nasconderebbe proprio i problemi cercati |
| 2026-10-16 | ~~I pulsanti dell'evento si deducevano dallo stato~~ Superata: i pulsanti Modifica, Pubblica, Chiudi iscrizioni, Annulla dipendono da `availableActions` dell'evento (`can()` in `event-manage-list.ts`) | Il backend ora le calcola (PR 10 del backend): la regola vive in un posto solo, come per le iscrizioni |
| 2026-10-16 | L'elenco gestito si cerca per titolo (`q`) e si ordina (`sort`, di default i piu' recenti) | Parametri aggiunti al backend (PR 10); i test trovano la scheda cercando il titolo, senza sfogliare le pagine |
| 2026-10-16 | La regione di una nuova bozza viene da `SessionService.regionCode()`, letta da `isMemberOf` (`agesci:PIE:segreteria`) | Nessuna claim `region` dedicata (scelta di Mahima); la segreteria crea solo per la sua regione |
| 2026-10-16 | Il modulo evento non tocca requisiti, adempimenti e referenti: li rimanda come li ha ricevuti | Arrivano dal tipo di evento e dopo la pubblicazione sono congelati; cosi' non si cambiano per sbaglio |

## 4. Registro dei contratti

Attriti trovati nel contratto del backend durante lo sviluppo del frontend.

| Data | Problema | Esito |
|---|---|---|
| 2026-10-16 | Il browser bloccava ogni chiamata (niente CORS) | Corretto nel backend, PR 008 |
| 2026-10-16 | Operazioni OpenAPI chiamate `get_1`, `update_2`: client illeggibile | Corretto nel backend, nomi `controller_metodo` |
| 2026-10-16 | `availableActions` e' un elenco di stringhe senza valori elencati nel contratto (WITHDRAW, SATISFY, APPROVE_*...) | Aperto: valutare un enum nel DTO del backend, cosi' il client generato li conosce |
| 2026-10-16 | L'errore 422 dei requisiti porta un elenco di motivi, gli altri un solo campo | Gestito nel frontend (`ApiError.details`); da documentare nel contratto |
| 2026-10-16 | `GET /documents/{id}/content` e' descritto come testo JSON, non come file binario | Aperto: dichiarare `application/octet-stream` nel backend; per ora download aggirato nel frontend |
| 2026-10-16 | I campi dell'OpenAPI sono quasi tutti opzionali (`?`) anche quando la risposta li ha sempre | Aperto: da valutare `@Schema(requiredMode)` sui DTO quando le pagine lo richiederanno |
| 2026-10-16 | Gli eventi non hanno `availableActions` (a differenza delle iscrizioni) | Corretto nel backend, PR 10 |
| 2026-10-16 | L'elenco `GET /events/managed` non ha ricerca per titolo ne' ordinamento: i nuovi eventi finiscono in pagine lontane | Corretto nel backend, PR 10 (`q`, `sort`, default piu' recenti) |
| 2026-10-16 | Una bozza accetta dati incompleti o incoerenti (date invertite), la pubblicazione li rifiuta | Voluto (bozza = lavoro in corso); il frontend mostra il motivo al momento della pubblicazione |

## 5. Fasi

Piano nel Claude Doc "Buona Caccia FE - Planner frontend": F0 fondamenta (questa), F1 catalogo, F2 iscrizione del socio, F3 adempimenti, F4 segreteria, F5 capi.
