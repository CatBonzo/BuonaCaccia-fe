import { expect, test } from '@playwright/test';
import { enrollId, enrollVia, publishEvent, publishRoverEvent, satisfyObligation, withdrawAll } from './api';
import { loginAs } from './login';

test.describe('iscrizione del socio', () => {
  test.beforeEach(async ({ request }) => {
    await withdrawAll(request, 'rover');
    await withdrawAll(request, 'scolta');
  });
  test.afterEach(async ({ request }) => {
    await withdrawAll(request, 'rover');
    await withdrawAll(request, 'scolta');
  });

  test('chi non e\' entrato viene invitato ad accedere', async ({ page, request }) => {
    const event = await publishRoverEvent(request, `anon${Date.now()}`);
    await page.goto(`/eventi/${event.id}`);
    await expect(page.getByTestId('login-to-enroll')).toBeVisible();
    await expect(page.getByTestId('enroll')).toHaveCount(0);
  });

  test('il rover si iscrive, vede cosa manca e poi si ritira', async ({ page, request }) => {
    const event = await publishRoverEvent(request, `rover${Date.now()}`);
    await loginAs(page, 'rover');
    await page.goto(`/eventi/${event.id}`);
    await page.getByTestId('enroll').click();

    await expect(page).toHaveURL(/\/iscrizioni$/);
    const card = page.locator('mat-card', { hasText: event.title });
    await expect(card.getByTestId('status')).toHaveText('Iscritto, da completare');
    await expect(card).toContainText('Completa entro il');
    await expect(card.getByTestId('open-form')).toHaveText("Compila l'iscrizione");

    // Cosa manca si vede nella pagina dell'iscrizione.
    await card.getByTestId('open-form').click();
    await expect(page.getByTestId('obligations')).toContainText('Autorizzazione');
    await expect(page.getByTestId('obligations')).toContainText('Quota di partecipazione');
    await page.getByRole('link', { name: '← Le mie iscrizioni' }).click();

    await card.getByTestId('withdraw').click();
    await card.getByTestId('confirm-withdraw').click();
    await expect(card.getByTestId('status')).toHaveText('Ritirata');
    await expect(card.getByTestId('withdraw')).toHaveCount(0);
  });

  test('il pagamento ha una pagina a parte: prima non e\' disponibile, dopo l\'autorizzazione mostra quota e IBAN', async ({ page, request }) => {
    const event = await publishEvent(request, `paga${Date.now()}`, { typeCode: 'ROSS', fee: 50 });
    const enrollment = await enrollId(request, 'rover', event.id);
    await loginAs(page, 'rover');
    await page.goto('/iscrizioni');
    const card = page.locator('mat-card', { hasText: event.title });
    await card.getByTestId('open-payment').click();
    await expect(page).toHaveURL(new RegExp(`/iscrizioni/${enrollment}/pagamento$`));
    await expect(page.getByTestId('amounts')).toContainText(/Quota\s*50/);
    await expect(page.getByTestId('payment-unavailable')).toBeVisible();

    await satisfyObligation(request, enrollment, 'UNIT_LEADER_AUTHORIZATION');
    await page.reload();
    await expect(page.getByTestId('bank')).toContainText('IBAN');
    await expect(page.getByTestId('payment-unavailable')).toHaveCount(0);
  });

  test('chi non ha i requisiti vede tutti i motivi insieme', async ({ page, request }) => {
    const event = await publishRoverEvent(request, `req${Date.now()}`);
    await loginAs(page, 'esploratore');
    await page.goto(`/eventi/${event.id}`);
    await page.getByTestId('enroll').click();

    const error = page.getByTestId('enroll-error');
    await expect(error).toContainText('requisiti');
    await expect(error.locator('li')).not.toHaveCount(0);
    await expect(error).toContainText('almeno 16 anni');
    await expect(page).toHaveURL(new RegExp(`/eventi/${event.id}$`));
  });

  test('a posti finiti si entra in lista d\'attesa', async ({ page, request }) => {
    const event = await publishRoverEvent(request, `attesa${Date.now()}`, 1);
    expect((await enrollVia(request, 'rover', event.id)).status()).toBe(201);

    await loginAs(page, 'scolta');
    await page.goto(`/eventi/${event.id}`);
    await page.getByTestId('enroll').click();

    await expect(page).toHaveURL(/\/iscrizioni$/);
    const card = page.locator('mat-card', { hasText: event.title });
    await expect(card.getByTestId('waiting')).toContainText('posto 1');
  });

  test('la pagina delle iscrizioni è raggiungibile da chi ha il permesso', async ({ page, request }) => {
    await withdrawAll(request, 'rover');
    await loginAs(page, 'lupetto');
    await page.goto('/iscrizioni');
    await expect(page.getByRole('heading', { name: 'Le mie iscrizioni' })).toBeVisible();
  });
});
