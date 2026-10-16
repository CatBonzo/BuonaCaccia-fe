import { APIRequestContext } from '@playwright/test';

export const API = 'http://localhost:8080';

/** Token di un utente di prova del backend. */
export async function tokenOf(request: APIRequestContext, username: string): Promise<string> {
  const response = await request.get(`${API}/api/v1/mock/auth/findAll`);
  const users = (await response.json()).payload as { username: string; accessToken: string }[];
  return users.find((u) => u.username === username)!.accessToken;
}

/** Crea e pubblica un evento regionale del Piemonte con titolo unico: gli scenari non dipendono dai dati gia' presenti. */
export async function publishEvent(
  request: APIRequestContext,
  tag: string,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; title: string }> {
  const headers = { Authorization: `Bearer ${await tokenOf(request, 'segreteria')}` };
  const title = `Campo ${tag}`;
  const created = await request.post(`${API}/api/v1/events`, {
    headers,
    data: {
      typeCode: 'CFA', title, description: 'Evento di prova', level: 'REGIONAL', region: 'PIE', enrollmentMode: 'SELF',
      location: 'Pian del Re', province: 'CN', startDate: '2027-03-10', endDate: '2027-03-12',
      registrationOpenDate: '2026-10-01', registrationCloseDate: '2027-03-01', seats: 10, fee: 50, ...overrides,
    },
  });
  const event = (await created.json()).payload;
  await request.post(`${API}/api/v1/events/${event.id}/publish`, { headers, data: { version: event.version } });
  return { id: event.id, title };
}

/** Evento per ragazzi RS aperto alle iscrizioni (tipo ROSS, 16-21 anni), con i posti indicati. */
export function publishRoverEvent(request: APIRequestContext, tag: string, seats = 5) {
  return publishEvent(request, tag, { typeCode: 'ROSS', seats, fee: 30 });
}

/** Ritira tutte le iscrizioni attive dell'utente: ogni scenario lascia pulito, il tipo ROSS ammette una sola iscrizione attiva. */
export async function withdrawAll(request: APIRequestContext, username: string): Promise<void> {
  const headers = { Authorization: `Bearer ${await tokenOf(request, username)}` };
  const mine = (await (await request.get(`${API}/api/v1/enrollments/mine?size=100`, { headers })).json()).payload.content as {
    id: string;
    active: boolean;
  }[];
  for (const enrollment of mine.filter((e) => e.active)) {
    await request.post(`${API}/api/v1/enrollments/${enrollment.id}/withdraw`, { headers });
  }
}

export async function enrollVia(request: APIRequestContext, username: string, eventId: string) {
  const headers = { Authorization: `Bearer ${await tokenOf(request, username)}` };
  return request.post(`${API}/api/v1/events/${eventId}/enrollments`, { headers, data: {} });
}

/** Modello di scheda per il tipo ROSS: due domande obbligatorie e una facoltativa riservata. */
export async function setRoverFormTemplate(request: APIRequestContext): Promise<void> {
  const headers = { Authorization: `Bearer ${await tokenOf(request, 'amministratore')}` };
  const q = (id: string, text: string, type: string, required: boolean, sensitive = false) => ({ id, text, type, required, sensitive });
  await request.put(`${API}/api/v1/event-types/ROSS/form-template`, {
    headers,
    data: {
      sections: [
        {
          title: 'Su di te',
          questions: [
            q('fede', 'Cosa ti aspetti dalla route?', 'LONG_TEXT', true),
            q('allergie', 'Allergie', 'TEXT', false, true),
            q('ok', 'Hai letto il regolamento?', 'YES_NO', true),
          ],
        },
      ],
    },
  });
}

/** Evento gratuito per rover che chiede una scheda sanitaria (PDF online) e la scheda elettronica. */
export async function publishEventWithPaperwork(request: APIRequestContext, tag: string) {
  await setRoverFormTemplate(request);
  return publishEvent(request, tag, {
    typeCode: 'ROSS',
    fee: 0,
    obligations: [
      {
        type: 'DOCUMENT', code: 'SCHEDA_SANITARIA', description: 'Scheda sanitaria', delivery: 'ONLINE',
        allowedMimeTypes: ['application/pdf'], maxSizeBytes: 1048576,
      },
      { type: 'ELECTRONIC_FORM', description: 'Scheda elettronica' },
    ],
  });
}

export async function enrollId(request: APIRequestContext, username: string, eventId: string): Promise<string> {
  const response = await enrollVia(request, username, eventId);
  return (await response.json()).payload.id;
}

/** Un PDF minimo ma riconosciuto dal backend (che guarda i primi byte, non l'estensione). */
export const TINY_PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

export async function rejectLatestDocument(request: APIRequestContext, enrollmentId: string, reason: string): Promise<void> {
  const headers = { Authorization: `Bearer ${await tokenOf(request, 'segreteria')}` };
  const docs = (await (await request.get(`${API}/api/v1/enrollments/${enrollmentId}/documents`, { headers })).json()).payload as {
    id: string;
    status: string;
  }[];
  const open = docs.find((d) => d.status === 'UPLOADED')!;
  await request.post(`${API}/api/v1/documents/${open.id}/reject`, { headers, data: { reason } });
}

export async function reopenForm(request: APIRequestContext, enrollmentId: string, reason: string): Promise<void> {
  const headers = { Authorization: `Bearer ${await tokenOf(request, 'segreteria')}` };
  await request.post(`${API}/api/v1/enrollments/${enrollmentId}/form/reopen`, { headers, data: { reason } });
}

/** Il socio carica un PDF per l'adempimento indicato, come farebbe dalla pagina delle iscrizioni. */
export async function uploadPdf(request: APIRequestContext, username: string, enrollmentId: string, code: string): Promise<void> {
  const headers = { Authorization: `Bearer ${await tokenOf(request, username)}` };
  await request.post(`${API}/api/v1/enrollments/${enrollmentId}/obligations/${code}/document`, {
    headers,
    multipart: { file: { name: 'scheda.pdf', mimeType: 'application/pdf', buffer: TINY_PDF } },
  });
}

/** La segreteria segna soddisfatto un adempimento (qui l'autorizzazione del capo, che abilita il pagamento). */
export async function satisfyObligation(request: APIRequestContext, enrollmentId: string, type: string): Promise<void> {
  const headers = { Authorization: `Bearer ${await tokenOf(request, 'segreteria')}` };
  await request.post(`${API}/api/v1/enrollments/${enrollmentId}/obligations/${type}/satisfy`, { headers, data: {} });
}

/** Il rover paga l'intera quota (autorizzazione del capo e bonifico registrati dalla segreteria) e poi si ritira: nasce un rimborso da lavorare. */
export async function payAndWithdraw(request: APIRequestContext, username: string, eventId: string, amount: number): Promise<void> {
  const id = await enrollId(request, username, eventId);
  await satisfyObligation(request, id, 'UNIT_LEADER_AUTHORIZATION');
  const headers = { Authorization: `Bearer ${await tokenOf(request, 'segreteria')}` };
  await request.post(`${API}/api/v1/enrollments/${id}/payments`, {
    headers,
    data: { amount, method: 'BANK_TRANSFER', receivedOn: new Date().toISOString().slice(0, 10), reference: `R-${Date.now()}` },
  });
  await request.post(`${API}/api/v1/enrollments/${id}/withdraw`, {
    headers: { Authorization: `Bearer ${await tokenOf(request, username)}` },
  });
}

/** Il token del link di autorizzazione che il capo riceve per e-mail (Mailpit), per l'iscrizione indicata. */
export async function authorizationToken(request: APIRequestContext, to: string, enrollmentNumber: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const list = await (await request.get(`http://localhost:8025/api/v1/search?query=${encodeURIComponent(`to:${to} ${enrollmentNumber}`)}`)).json();
    for (const m of list.messages ?? []) {
      const body = (await (await request.get(`http://localhost:8025/api/v1/message/${m.ID}`)).json()).Text as string;
      const match = /\/autorizza\/([A-Za-z0-9_-]+)/.exec(body);
      if (match) return match[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Nessuna e-mail di autorizzazione per ${enrollmentNumber}`);
}

export async function enrollYouth(request: APIRequestContext, leader: string, eventId: string, memberCode: string) {
  const headers = { Authorization: `Bearer ${await tokenOf(request, leader)}` };
  return request.post(`${API}/api/v1/events/${eventId}/enrollments`, { headers, data: { memberCode } });
}

/** Una bozza di evento del Piemonte con titolo unico, non pubblicata. */
export async function createDraft(request: APIRequestContext, tag: string): Promise<{ id: string; title: string }> {
  const headers = { Authorization: `Bearer ${await tokenOf(request, 'segreteria')}` };
  const title = `Campo ${tag}`;
  const created = await request.post(`${API}/api/v1/events`, {
    headers,
    data: {
      typeCode: 'ROSS', title, description: 'Bozza di prova', level: 'REGIONAL', region: 'PIE', enrollmentMode: 'SELF',
      location: 'Pian del Re', province: 'CN', startDate: '2027-03-10', endDate: '2027-03-12',
      registrationOpenDate: '2026-10-01', registrationCloseDate: '2027-03-01', seats: 10, fee: 0,
    },
  });
  return { id: (await created.json()).payload.id, title };
}
