import { expect, test } from '@playwright/test';
import { API, authorizationToken, tokenOf, enrollId, publishEvent, withdrawAll } from './api';
import { loginAs } from './login';

test.describe('capi', () => {
  test.beforeEach(async ({ request }) => {
    await withdrawAll(request, 'rover');
    await withdrawAll(request, 'scolta');
  });
  test.afterEach(async ({ request }) => {
    await withdrawAll(request, 'rover');
    await withdrawAll(request, 'scolta');
  });

  test('il capo vede le autorizzazioni da dare e le concede o le nega con un motivo', async ({ page, request }) => {
    const event = await publishEvent(request, `capi${Date.now()}`, { typeCode: 'ROSS', fee: 0 });
    await enrollId(request, 'rover', event.id);

    await loginAs(page, 'socio');
    await expect(page.getByRole('link', { name: 'Autorizzazioni da dare' })).toBeVisible();
    await loginAs(page, 'rover');
    await expect(page.getByRole('link', { name: 'Autorizzazioni da dare' })).toHaveCount(0);

    await loginAs(page, 'capogruppo');
    await page.goto('/capi/autorizzazioni');
    const card = page.locator('mat-card', { hasText: event.title });
    await expect(card).toHaveCount(1);
    await card.getByTestId('reject').click();
    await card.getByTestId('confirm-reject').click();
    await expect(page.getByTestId('leader-error')).toContainText('motivo');
    await card.getByTestId('reject-reason').fill('Non e\' ancora pronto');
    await card.getByTestId('confirm-reject').click();
    // L'iscrizione e' stata rifiutata: sparisce dalle autorizzazioni da dare.
    await expect(page.locator('mat-card', { hasText: event.title })).toHaveCount(0);
  });

  test('il capo concede l\'autorizzazione dal sito', async ({ page, request }) => {
    const event = await publishEvent(request, `capa${Date.now()}`, { typeCode: 'ROSS', fee: 0 });
    await enrollId(request, 'rover', event.id);

    await loginAs(page, 'capogruppo');
    await page.goto('/capi/autorizzazioni');
    const card = page.locator('mat-card', { hasText: event.title });
    await expect(card.getByTestId('approve').first()).toBeVisible();
    while (await card.getByTestId('approve').count()) {
      await card.getByTestId('approve').first().click();
      await page.waitForTimeout(400);
    }
    await expect(card.getByTestId('approve')).toHaveCount(0);
  });

  test('il capo iscrive un ragazzo e lo ritrova tra gli iscritti', async ({ page, request }) => {
    const selfOnly = await publishEvent(request, `caps${Date.now()}`, { typeCode: 'ROSS', fee: 0 });
    const event = await publishEvent(request, `capi${Date.now()}`, { typeCode: 'ROSS', fee: 0, enrollmentMode: 'BOTH' });

    await loginAs(page, 'capogruppo');
    // Un evento solo per iscrizioni personali non offre l'iscrizione di un ragazzo.
    await page.goto(`/eventi/${selfOnly.id}`);
    await expect(page.getByTestId('enroll')).toBeVisible();
    await expect(page.getByTestId('enroll-youth')).toHaveCount(0);

    await page.goto(`/eventi/${event.id}`);
    await page.getByTestId('member-code').fill('999999');
    await page.getByTestId('enroll-youth').click();
    await expect(page.getByTestId('enroll-error')).toBeVisible();

    await page.getByTestId('member-code').fill('100012');
    await page.getByTestId('enroll-youth').click();
    await expect(page).toHaveURL(/capi\/iscritti/);
    const card = page.locator('mat-card', { hasText: event.title });
    await expect(card).toContainText('Scolta');
  });

  test('dal link dell\'e-mail il capo autorizza senza accedere', async ({ page, request }) => {
    const event = await publishEvent(request, `capl${Date.now()}`, { typeCode: 'ROSS', fee: 0 });
    const id = await enrollId(request, 'rover', event.id);
    const headers = { Authorization: `Bearer ${await tokenOf(request, 'rover')}` };
    const number = (await (await request.get(`${API}/api/v1/enrollments/${id}`, { headers })).json()).payload.number as string;
    const token = await authorizationToken(request, 'capogruppo@buonacaccia.local', number);

    await page.goto(`/autorizza/${token}`);
    await expect(page.getByTestId('link-card')).toContainText(event.title);
    await page.getByTestId('link-approve').click();
    await expect(page.getByTestId('link-outcome')).toContainText('Autorizzazione data');

    // Il link e' monouso.
    await page.goto(`/autorizza/${token}`);
    await expect(page.getByTestId('link-error')).toBeVisible();
  });
});
