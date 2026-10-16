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
| 2026-10-16 | Il modulo evento avvisa subito delle date incoerenti (`dateWarnings()`), ma la bozza si salva comunque | Mahima: "l'avviso teniamolo". Le regole sono le stesse del backend (rientro dopo la partenza, chiusura dopo l'apertura, chiusura entro la partenza); il backend resta l'arbitro alla pubblicazione |
| 2026-10-16 | Iscrizioni da gestire: si sceglie un evento (non bozza) e si vedono le sue iscrizioni con filtri stato e posto; "Segna come fatto" compare solo se `availableActions` contiene `SATISFY` e l'adempimento e' da fare | La regola di chi puo' agire resta nel backend. Il pagamento e' escluso: ha la sua schermata (F4c) perche' va registrato con importo e data |
| 2026-10-16 | La segreteria non puo' rifiutare un adempimento dalla schermata iscrizioni | L'endpoint `reject` dell'adempimento e' dei capi (autorizzazioni); la segreteria rifiuta i documenti dalla coda e annulla/riapre altrove. Non ho inventato un'azione che il backend non offre |
| 2026-10-16 | Coda documenti con filtro per evento e stato (di default "caricato, in attesa"); il rifiuto richiede il motivo, che il socio riceve | Il backend ordina dal piu' vecchio e senza filtro per evento la coda di una regione e' lunga da scorrere; il motivo e' gia' obbligatorio nel contratto, qui lo si chiede prima di inviare |
| 2026-10-16 | Pagamenti: si sceglie un evento a pagamento; si vedono i totali (incassato, rimborsato, da rimborsare, annullato), le iscrizioni con residuo, i pagamenti registrati e il CSV | La segreteria riconcilia per evento. I rimborsi hanno una coda propria (prossima PR) |
| 2026-10-16 | "Da incassare" viene dal campo `outstanding` della riconciliazione (una sola chiamata) | ~~Prima si leggeva l'elenco iscrizioni perche' `outstanding` non aveva l'id~~ Superata: il backend ora porta `enrollmentId` (PR 11 del backend) |
| 2026-10-16 | Il blocco "il pagamento si abilita dopo l'autorizzazione del capo" non e' copiato nel frontend: si mostra l'errore del backend (409 40910) | La regola vive nel servizio; copiarla vorrebbe dire tenerla allineata in due posti |
| 2026-10-16 | `FileDownload` (core/file-download.ts) scarica qualunque file come Blob; `DocumentDownload` lo usa | Il CSV ha lo stesso problema dei documenti: il contratto lo descrive come testo JSON |
| 2026-10-16 | Coda rimborsi (`/segreteria/rimborsi`, permesso `pagamento:registrazione`): filtri evento e stato (di default "Da lavorare"), azioni prendi in carico / segna emesso (data, riferimento facoltativo) / rifiuta con motivo | Sono i tre passi che offre il backend; il motivo del rifiuto e' obbligatorio anche nella schermata per non aspettare l'errore. Le azioni mostrate seguono lo stato del rimborso, il backend resta l'arbitro |
| 2026-10-16 | I menu degli eventi nelle pagine della segreteria sono ordinati dai piu' recenti (`createdAt,desc`), non per titolo | Con piu' di 100 eventi (capita nei dati di prova) quelli nuovi finivano oltre il limite e non si potevano scegliere; i recenti sono anche quelli che si cercano di solito |
| 2026-10-16 | Documenti e CSV si scaricano con il client generato (restituisce un Blob); `FileDownload.save` lo offre al browser | ~~Prima si usava HttpClient a mano perche' il contratto li descriveva come testo JSON~~ Superata: il backend li dichiara come file (PR 11 del backend) |
| 2026-10-16 | Capi: voci di menu "Autorizzazioni da dare" e "Ragazzi che ho iscritto" solo se il censimento dice `memberType = LEADER` (`SessionService.isLeader`) | Il token non dice se una persona e' capo: lo dice il censimento che il login mock restituisce. Il permesso `iscrizione:self` resta necessario, ma non basta a distinguere un capo da un ragazzo |
| 2026-10-16 | Un solo componente (`LeaderEnrollments`) per le due liste dei capi, scelto dal dato di rotta `mode` | Le due liste hanno la stessa forma (iscrizioni con adempimenti e azioni): cambia solo la chiamata |
| 2026-10-16 | Autorizza/Nega seguono `availableActions` (APPROVE_/REJECT_UNIT_LEADER...) e non una regola copiata nel frontend | Il backend sa se il capo e' capo unita', capo gruppo o entrambi; il frontend mostra cio' che puo' fare |
| 2026-10-16 | Il link dell'e-mail porta a `/autorizza/:token`, pagina pubblica senza accesso | E' l'indirizzo che il backend scrive nelle e-mail (`link-base-url`); il token e' monouso e il backend risponde con errore al secondo uso |
| 2026-10-16 | "Iscrivi un ragazzo" compare nel dettaglio evento solo ai capi e solo se l'evento non e' `SELF` | L'evento solo personale rifiuta le iscrizioni dei capi: meglio non offrire un pulsante che dara' sempre errore |
| 2026-10-16 | Gestione eventi: pulsante "Elimina" (con conferma in linea) quando `availableActions` contiene `DELETE`; per un evento con iscrizioni compare solo "Annulla l'evento" | Mahima (2026-10-16) ha chiesto di poter eliminare bozze ed eventi creati. La regola (solo senza iscrizioni) e' del backend (PR 12) e arriva come azione, il frontend non la ricalcola. Client rigenerato con `api:sync` |

## 4. Registro dei contratti

Attriti trovati nel contratto del backend durante lo sviluppo del frontend.

| Data | Problema | Esito |
|---|---|---|
| 2026-10-16 | Il browser bloccava ogni chiamata (niente CORS) | Corretto nel backend, PR 008 |
| 2026-10-16 | Operazioni OpenAPI chiamate `get_1`, `update_2`: client illeggibile | Corretto nel backend, nomi `controller_metodo` |
| 2026-10-16 | `availableActions` e' un elenco di stringhe senza valori elencati nel contratto (WITHDRAW, SATISFY, APPROVE_*...) | Aperto: valutare un enum nel DTO del backend, cosi' il client generato li conosce |
| 2026-10-16 | L'errore 422 dei requisiti porta un elenco di motivi, gli altri un solo campo | Gestito nel frontend (`ApiError.details`); da documentare nel contratto |
| 2026-10-16 | `GET /documents/{id}/content` e' descritto come testo JSON, non come file binario | Corretto nel backend, PR 11 (`application/octet-stream`) |
| 2026-10-16 | I campi dell'OpenAPI sono quasi tutti opzionali (`?`) anche quando la risposta li ha sempre | Aperto: da valutare `@Schema(requiredMode)` sui DTO quando le pagine lo richiederanno |
| 2026-10-16 | Gli eventi non hanno `availableActions` (a differenza delle iscrizioni) | Corretto nel backend, PR 10 |
| 2026-10-16 | L'elenco `GET /events/managed` non ha ricerca per titolo ne' ordinamento: i nuovi eventi finiscono in pagine lontane | Corretto nel backend, PR 10 (`q`, `sort`, default piu' recenti) |
| 2026-10-16 | Una bozza accetta dati incompleti o incoerenti (date invertite), la pubblicazione li rifiuta | Voluto (bozza = lavoro in corso); il frontend mostra il motivo al momento della pubblicazione |
| 2026-10-16 | La segreteria non ha un'azione per rifiutare un adempimento di un'iscrizione (l'endpoint reject e' dei capi) | Aperto: chiedere a Mahima se serve (es. rifiutare per documento cartaceo non valido) |
| 2026-10-16 | `GET /events/{id}/reconciliation/export` e' descritto come testo JSON, non come file CSV | Corretto nel backend, PR 11 (`text/csv`, formato binario) |
| 2026-10-16 | `outstanding` nella riconciliazione ha numero e nome ma non l'id dell'iscrizione | Corretto nel backend, PR 11 (`enrollmentId`) |

## 5. Fasi

Piano nel Claude Doc "Buona Caccia FE - Planner frontend": F0 fondamenta (questa), F1 catalogo, F2 iscrizione del socio, F3 adempimenti, F4 segreteria, F5 capi.
