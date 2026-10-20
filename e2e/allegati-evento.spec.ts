import { expect, test } from '@playwright/test';
import { TINY_PDF, publishRoverEvent } from './api';
import { loginAs } from './login';

test.describe('allegati dell\'evento', () => {
  test('la segreteria allega un file, il pubblico lo scarica, poi la segreteria lo toglie', async ({ page, request, browser }) => {
    const event = await publishRoverEvent(request, `allegati${Date.now()}`);
    await loginAs(page, 'segreteria');
    await page.goto(`/segreteria/eventi/${event.id}/modifica`);

    await page.getByTestId('allegato-file').setInputFiles({ name: 'programma.pdf', mimeType: 'application/pdf', buffer: TINY_PDF });
    await expect(page.getByTestId('allegato')).toContainText('programma.pdf');

    // Un file che non e' PDF/JPEG/PNG viene rifiutato con il motivo.
    await page.getByTestId('allegato-file').setInputFiles({ name: 'finto.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html></html>') });
    await expect(page.getByTestId('allegati-errore')).toContainText('Formato non riconosciuto');

    // Chi non ha fatto accesso vede l'elenco e scarica.
    const visitor = await browser.newPage();
    await visitor.goto(`/eventi/${event.id}`);
    await expect(visitor.getByTestId('allegato')).toContainText('programma.pdf');
    const [download] = await Promise.all([visitor.waitForEvent('download'), visitor.getByTestId('allegato-scarica').click()]);
    expect(download.suggestedFilename()).toBe('programma.pdf');
    await expect(visitor.getByTestId('allegato-togli')).toHaveCount(0);
    await visitor.close();

    await page.getByTestId('allegato-togli').click();
    await expect(page.getByTestId('allegato')).toHaveCount(0);
  });

  test('nella nuova bozza gli allegati si fanno dopo averla creata', async ({ page }) => {
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/eventi/nuovo');
    await expect(page.getByTestId('allegati-dopo-bozza')).toBeVisible();
  });
});
