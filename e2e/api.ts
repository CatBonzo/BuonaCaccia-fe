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
