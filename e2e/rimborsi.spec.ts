import { expect, Page, test } from '@playwright/test';
import { payAndWithdraw, publishEvent, withdrawAll } from './api';
import { loginAs } from './login';

async function chooseEvent(page: Page, title: string) {
  await page.getByTestId('event').click();
  await page.getByRole('option', { name: new RegExp(title) }).click();
}

test.describe('rimborsi della segreteria', () => {
  test.beforeEach(async ({ request }) => withdrawAll(request, 'rover'));
  test.afterEach(async ({ request }) => withdrawAll(request, 'rover'));

  test('prende in carico, segna emesso con riferimento', async ({ page, request }) => {
    const event = await publishEvent(request, `rimb${Date.now()}`, { typeCode: 'ROSS', fee: 50 });
    await payAndWithdraw(request, 'rover', event.id, 50);

    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/rimborsi');
    await chooseEvent(page, event.title);

    const card = page.locator('mat-card[data-refund]');
    await expect(card.getByTestId('refund-status')).toContainText('Da lavorare');
    await expect(card).toContainText('50,00');
    await card.getByTestId('take').click();
    await expect(page.locator('mat-card[data-refund]')).toHaveCount(0); // il filtro e' "Da lavorare"

    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: 'In lavorazione' }).click();
    await expect(card.getByTestId('refund-status')).toContainText('In lavorazione');
    await card.getByTestId('issue').click();
    await card.getByTestId('reference').fill('CRO-RIMB-1');
    await card.getByTestId('confirm-issue').click();

    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: 'Emesso' }).click();
    await expect(card.getByTestId('issued')).toContainText('CRO-RIMB-1');
  });

  test('il rifiuto vuole un motivo', async ({ page, request }) => {
    const event = await publishEvent(request, `rimr${Date.now()}`, { typeCode: 'ROSS', fee: 50 });
    await payAndWithdraw(request, 'rover', event.id, 50);

    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/rimborsi');
    await chooseEvent(page, event.title);

    const card = page.locator('mat-card[data-refund]');
    await card.getByTestId('reject').click();
    await card.getByTestId('confirm-reject').click();
    await expect(page.getByTestId('refund-error')).toContainText('motivo');
    await card.getByTestId('reject-reason').fill('IBAN non valido');
    await card.getByTestId('confirm-reject').click();

    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: 'Rifiutato' }).click();
    await expect(card.getByTestId('rejected')).toContainText('IBAN non valido');
  });
});
