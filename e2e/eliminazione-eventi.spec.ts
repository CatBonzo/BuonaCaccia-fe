import { expect, Page, test } from '@playwright/test';
import { createDraft, enrollId, publishEvent, withdrawAll } from './api';
import { loginAs } from './login';

async function findCard(page: Page, title: string) {
  await page.getByTestId('q').fill(title);
  await page.getByTestId('apply').click();
  return page.locator('tr[mat-row]', { hasText: title });
}

test.describe('eliminazione degli eventi', () => {
  test.beforeEach(async ({ request }) => withdrawAll(request, 'rover'));
  test.afterEach(async ({ request }) => withdrawAll(request, 'rover'));

  test('elimina una bozza, dopo la conferma', async ({ page, request }) => {
    const draft = await createDraft(request, `elim${Date.now()}`);
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/eventi');

    const card = await findCard(page, draft.title);
    await expect(card).toHaveCount(1);
    await card.getByTestId('delete').click();
    await page.getByRole('button', { name: 'No' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(card).toHaveCount(1);

    await card.getByTestId('delete').click();
    await page.getByTestId('confirm-delete').click();
    await expect(page.locator('tr[mat-row]', { hasText: draft.title })).toHaveCount(0);
  });

  test('elimina un evento creato che non ha iscrizioni', async ({ page, request }) => {
    const event = await publishEvent(request, `elic${Date.now()}`, { typeCode: 'ROSS' });
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/eventi');

    const card = await findCard(page, event.title);
    await expect(card).toHaveCount(1);
    await card.getByTestId('delete').click();
    await page.getByTestId('confirm-delete').click();
    await expect(page.locator('tr[mat-row]', { hasText: event.title })).toHaveCount(0);
  });

  test('un evento con iscrizioni non si elimina, si puo\' annullare', async ({ page, request }) => {
    const event = await publishEvent(request, `elis${Date.now()}`, { typeCode: 'ROSS' });
    await enrollId(request, 'rover', event.id);
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/eventi');

    const card = await findCard(page, event.title);
    await expect(card).toHaveCount(1);
    await card.getByTestId('more').click();
    await expect(page.getByTestId('cancel')).toBeVisible();
    await expect(card.getByTestId('delete')).toHaveCount(0);
  });
});
