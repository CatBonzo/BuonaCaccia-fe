# Buona Caccia - frontend

Frontend Angular delle iscrizioni agli eventi AGESCI. Backend: [Buoncaccia-be](https://github.com/CatBonzo/Buoncaccia-be).

## Avvio

1. Backend: nel repository del backend, `docker compose up -d` e avvio con il profilo `mocked` (porta 8080).
2. Qui: `npm install`, poi `npm start` e apri http://localhost:4200.
3. Accesso di prova: la pagina di login elenca gli utenti finti del backend.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm start` | server di sviluppo su :4200 |
| `npm test` | test unitari (Vitest) |
| `npm run e2e` | test end-to-end (Playwright) contro il backend vero su :8080 |
| `npm run api:sync` | riscarica `/api-docs` dal backend e rigenera il client in `src/app/api` |
| `npm run build` | build di produzione |

Per `npm run e2e` serve Chromium: se non e' installato da Playwright, imposta `PLAYWRIGHT_CHROMIUM` al percorso dell'eseguibile.

## Struttura

- `src/app/api`: client generato dall'OpenAPI del backend. Non si modifica a mano.
- `src/app/core`: sessione, intercettori HTTP, errori dell'API, guardie.
- `src/app/layout`: guscio con barra e menu per permessi.
- `src/app/pages`: una cartella per pagina.
- `e2e`: scenari Playwright.

Decisioni e coordinamento col backend: `AGENTS.md`.
