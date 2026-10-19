import { expect, test } from '@playwright/test';
import { TINY_PDF, enrollId, publishEvent, setRoverFormTemplate, uploadPdf, withdrawAll } from './api';
import { chooseEvent } from './choose-event';
import { loginAs } from './login';

/** Evento gratuito con una scheda sanitaria online e un modulo da consegnare in segreteria. */
function publishWithDocuments(request: Parameters<typeof publishEvent>[0], tag: string) {
  return publishEvent(request, tag, {
    typeCode: 'ROSS',
    fee: 0,
    obligations: [
      {
        type: 'DOCUMENT', code: 'SCHEDA_SANITARIA', description: 'Scheda sanitaria', delivery: 'ONLINE',
        allowedMimeTypes: ['application/pdf'], maxSizeBytes: 1048576,
      },
      { type: 'DOCUMENT', code: 'MODULO_CARTACEO', description: 'Modulo firmato', delivery: 'PAPER' },
    ],
  });
}

test.describe('segreteria: iscrizioni e documenti', () => {
  test.beforeEach(async ({ request }) => withdrawAll(request, 'rover'));
  test.afterEach(async ({ request }) => withdrawAll(request, 'rover'));

  test('vede le iscrizioni di un evento e segna come fatto il modulo cartaceo', async ({ page, request }) => {
    const event = await publishWithDocuments(request, `segr${Date.now()}`);
    await enrollId(request, 'rover', event.id);

    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/iscrizioni');
    await expect(page.getByTestId('pick-event')).toBeVisible();
    await chooseEvent(page, event.title);

    const card = page.locator('mat-card[data-enrollment]');
    await expect(card).toHaveCount(1);
    await expect(card.getByTestId('status')).toContainText('Iscritto, da completare');

    // Il modulo cartaceo lo segna la segreteria; la scheda online aspetta il caricamento del socio.
    await expect(card.getByTestId('satisfy')).toHaveCount(2);
    await card.locator('li', { hasText: 'Modulo firmato' }).getByTestId('satisfy').click();
    await expect(card.locator('li', { hasText: 'Modulo firmato' }).getByTestId('obligation-status')).toContainText('Fatto');
    await expect(card.getByTestId('status')).toContainText('Iscritto, da completare');

    // Il filtro per stato esclude chi non e' piu' in quello stato.
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: 'Ritirata' }).click();
    await expect(page.getByTestId('empty')).toBeVisible();
  });

  test('arriva dall\'elenco eventi con l\'evento gia\' scelto', async ({ page, request }) => {
    const event = await publishWithDocuments(request, `link${Date.now()}`);
    await enrollId(request, 'rover', event.id);
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/eventi');
    await page.getByTestId('q').fill(event.title);
    await page.getByTestId('apply').click();
    await page.locator('tr[mat-row]', { hasText: event.title }).getByTestId('more').click();
    await page.getByTestId('enrollments').click();
    await expect(page.locator('mat-card[data-enrollment]')).toHaveCount(1);
  });

  test('valida un documento e ne rifiuta un altro con il motivo', async ({ page, request }) => {
    const event = await publishWithDocuments(request, `coda${Date.now()}`);
    const enrollment = await enrollId(request, 'rover', event.id);
    await uploadPdf(request, 'rover', enrollment, 'SCHEDA_SANITARIA');

    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/documenti');
    await chooseEvent(page, event.title);
    const card = page.locator('mat-card', { hasText: 'SCHEDA_SANITARIA' });
    await expect(card).toHaveCount(1);
    await expect(card.getByTestId('doc-status')).toContainText('in attesa');

    // Il motivo e' obbligatorio: senza, il documento resta com'e'.
    await card.getByTestId('reject').click();
    await card.getByTestId('confirm-reject').click();
    await expect(page.getByTestId('queue-error')).toBeVisible();
    await card.getByTestId('reject-reason').fill('Foto sfocata');
    await card.getByTestId('confirm-reject').click();
    await expect(page.getByTestId('empty')).toBeVisible();

    // Il socio ricarica, la segreteria valida.
    await uploadPdf(request, 'rover', enrollment, 'SCHEDA_SANITARIA');
    await page.reload();
    await chooseEvent(page, event.title);
    await expect(card).toHaveCount(1);
    await card.getByTestId('validate').click();
    await expect(page.getByTestId('empty')).toBeVisible();

    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: 'Approvato' }).click();
    await expect(card.getByTestId('doc-status')).toContainText('Approvato');
  });
});
