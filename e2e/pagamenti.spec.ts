import { expect, test } from '@playwright/test';
import { enrollId, publishEvent, satisfyObligation, withdrawAll } from './api';
import { chooseEvent } from './choose-event';
import { loginAs } from './login';

test.describe('pagamenti della segreteria', () => {
  test.beforeEach(async ({ request }) => withdrawAll(request, 'rover'));
  test.afterEach(async ({ request }) => withdrawAll(request, 'rover'));

  test('registra un bonifico parziale, rifiuta un importo troppo alto e annulla il pagamento con motivo', async ({ page, request }) => {
    const event = await publishEvent(request, `pag${Date.now()}`, { typeCode: 'ROSS', fee: 50 });
    const enrollment = await enrollId(request, 'rover', event.id);

    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/pagamenti');
    await expect(page.getByTestId('pick-event')).toBeVisible();
    await chooseEvent(page, event.title);

    // Prima dell'autorizzazione del capo il backend non accetta bonifici e lo dice.
    const owing = page.locator('mat-card[data-enrollment]');
    await owing.getByTestId('register').click();
    await owing.getByTestId('amount').fill('20');
    await owing.getByTestId('confirm-register').click();
    await expect(page.getByTestId('payment-error')).toContainText('autorizzazione');
    await satisfyObligation(request, enrollment, 'UNIT_LEADER_AUTHORIZATION');
    await page.reload();
    await chooseEvent(page, event.title);

    await expect(owing.getByTestId('owed')).toContainText('residuo');
    await expect(page.getByTestId('no-payments')).toBeVisible();

    // Un bonifico parziale: il residuo scende.
    await owing.getByTestId('register').click();
    await owing.getByTestId('amount').fill('20');
    await owing.getByTestId('reference').fill('CRO-001');
    await owing.getByTestId('confirm-register').click();
    await expect(page.getByTestId('collected')).toContainText('20,00');
    await expect(owing.getByTestId('owed')).toContainText('30,00');

    // Piu' del residuo il backend lo rifiuta e dice perche'.
    await owing.getByTestId('register').click();
    await owing.getByTestId('amount').fill('100');
    await owing.getByTestId('confirm-register').click();
    await expect(page.getByTestId('payment-error')).toContainText('residuo');
    await owing.getByRole('button', { name: 'Non registrare' }).click();

    // L'annullamento vuole un motivo e rimette tutto com'era.
    const payment = page.locator('mat-card[data-payment]');
    await payment.getByTestId('cancel').click();
    await payment.getByTestId('confirm-cancel').click();
    await expect(page.getByTestId('payment-error')).toBeVisible();
    await payment.getByTestId('cancel-reason').fill('Bonifico inserito per errore');
    await payment.getByTestId('confirm-cancel').click();
    await expect(payment.getByTestId('payment-status')).toContainText('Annullato');
    await expect(page.getByTestId('collected')).toContainText('0,00');
    await expect(owing.getByTestId('owed')).toContainText('50,00');
  });

  test('scarica il CSV della riconciliazione', async ({ page, request }) => {
    const event = await publishEvent(request, `csv${Date.now()}`, { typeCode: 'ROSS', fee: 50 });
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/pagamenti');
    await chooseEvent(page, event.title);
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()]);
    expect(download.suggestedFilename()).toBe(`riconciliazione-${event.id}.csv`);
  });

  test('chi non ha il permesso non vede i pagamenti', async ({ page }) => {
    await loginAs(page, 'socio');
    await page.goto('/segreteria/pagamenti');
    await expect(page).not.toHaveURL(/segreteria\/pagamenti/);
  });
});
