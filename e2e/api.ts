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
