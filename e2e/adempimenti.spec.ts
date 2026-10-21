import { expect, test } from '@playwright/test';
import {
  TINY_PDF, enrollId, publishEventWithPaperwork, rejectLatestDocument, reopenForm, withdrawAll,
} from './api';
import { loginAs } from './login';

test.describe('documenti e scheda del socio', () => {
  test.beforeEach(async ({ request }) => withdrawAll(request, 'rover'));
  test.afterEach(async ({ request }) => withdrawAll(request, 'rover'));

  test('carica un documento, vede il rifiuto della segreteria e lo ricarica', async ({ page, request }) => {
    const event = await publishEventWithPaperwork(request, `doc${Date.now()}`);
    const enrollment = await enrollId(request, 'rover', event.id);
    await loginAs(page, 'rover');
    // In "Le mie iscrizioni" c'e' solo l'evento e il bottone: i file si caricano nella pagina di compilazione.
    await page.goto('/iscrizioni');
    await page.locator('mat-card', { hasText: event.title }).getByTestId('open-form').click();
    await expect(page).toHaveURL(new RegExp(`/iscrizioni/${enrollment}/scheda$`));
    await expect(page.getByTestId('enrollment-title')).toContainText(event.title);
    const card = page.locator('body');

    // Un file di testo non e' un formato ammesso: il motivo del backend arriva a schermo.
    await card.getByTestId('file-SCHEDA_SANITARIA').setInputFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('ciao') });
    await expect(card.getByTestId('doc-error')).toContainText('Formato non riconosciuto');

    await card.getByTestId('file-SCHEDA_SANITARIA').setInputFiles({ name: 'scheda.pdf', mimeType: 'application/pdf', buffer: TINY_PDF });
    await expect(card.getByTestId('doc-status')).toContainText('scheda.pdf');
    await expect(card.getByTestId('doc-status')).toContainText('in attesa di verifica');

    // Il file caricato si riscarica con il suo nome.
    const [download] = await Promise.all([page.waitForEvent('download'), card.getByRole('button', { name: 'Scarica' }).click()]);
    expect(download.suggestedFilename()).toBe('scheda.pdf');

    await rejectLatestDocument(request, enrollment, 'Foto sfocata');
    await page.reload();
    await expect(card.getByTestId('doc-rejection')).toContainText('Foto sfocata');

    await card.getByTestId('file-SCHEDA_SANITARIA').setInputFiles({ name: 'scheda2.pdf', mimeType: 'application/pdf', buffer: TINY_PDF });
    await expect(card.getByTestId('doc-status')).toContainText('scheda2.pdf');
  });

  test('compila la scheda a piu\' riprese, la invia e la segreteria puo\' riaprirla', async ({ page, request }) => {
    const event = await publishEventWithPaperwork(request, `scheda${Date.now()}`);
    const enrollment = await enrollId(request, 'rover', event.id);
    await loginAs(page, 'rover');
    await page.goto('/iscrizioni');
    await page.locator('mat-card', { hasText: event.title }).getByTestId('open-form').click();
    await expect(page).toHaveURL(new RegExp(`/iscrizioni/${enrollment}/scheda$`));

    // Inviare vuota: gli errori compaiono sotto le domande obbligatorie.
    await page.getByTestId('submit-form').click();
    await expect(page.getByTestId('error-fede')).toBeVisible();
    await expect(page.getByTestId('error-ok')).toBeVisible();

    // Salvare una bozza parziale e ritrovarla dopo il ricaricamento.
    await page.locator('[data-question="fede"] textarea').fill('Camminare con il mio clan');
    await page.getByTestId('save-form').click();
    await page.reload();
    await expect(page.locator('[data-question="fede"] textarea')).toHaveValue('Camminare con il mio clan');

    await page.locator('[data-question="ok"]').getByText('Sì').click();
    await page.getByTestId('submit-form').click();
    await expect(page.getByTestId('form-status')).toContainText('Scheda inviata');
    // Il badge "Inviata" sta accanto al titolo della pagina; gli stati degli adempimenti hanno l'icona.
    await expect(page.getByRole('heading', { name: /Compila l'iscrizione/ }).getByTestId('form-tag')).toHaveText('Inviata');
    await expect(page.locator('[data-testid="obligations"] .state i').first()).toBeVisible();
    await expect(page.getByTestId('submit-form')).toHaveCount(0);

    await reopenForm(request, enrollment, 'Manca il recapito');
    await page.reload();
    await expect(page.getByTestId('reopen-reason')).toContainText('Manca il recapito');
    await expect(page.getByTestId('submit-form')).toBeVisible();
  });
});
