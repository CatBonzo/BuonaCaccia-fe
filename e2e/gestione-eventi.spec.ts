import { expect, Page, test } from '@playwright/test';
import { loginAs } from './login';

async function choose(page: Page, testId: string, option: string) {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

/** Si cerca per titolo: il titolo e' unico, quindi resta una sola scheda. */
async function findCard(page: Page, title: string) {
  await page.getByTestId('q').fill(title);
  await page.getByTestId('apply').click();
  const card = page.locator('mat-card', { hasText: title });
  await expect(card).toHaveCount(1);
  return card;
}

test.describe('gestione eventi della segreteria', () => {
  test('crea una bozza, la pubblica, la vede nel catalogo, chiude le iscrizioni e annulla con motivo', async ({ page }) => {
    const title = `Campo segreteria ${Date.now()}`;
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/eventi/nuovo');

    await choose(page, 'f-type', 'Campo di formazione associativa');
    await page.getByTestId('f-title').fill(title);
    await page.getByTestId('f-location').fill('Pian del Re');
    await page.getByTestId('f-province').fill('cn');
    await page.getByTestId('f-start').fill('2027-03-10');
    await page.getByTestId('f-end').fill('2027-03-09');
    // L'avviso compare subito, senza salvare; con l'ordine giusto sparisce.
    await expect(page.getByTestId('date-warning')).toContainText('rientro non può precedere');
    await page.getByTestId('f-open').fill('2026-10-01');
    await page.getByTestId('f-close').fill('2027-03-01');
    await page.getByTestId('f-seats').fill('10');
    await page.getByTestId('f-fee').fill('50');
    await choose(page, 'f-mode', 'Il socio da solo');
    await page.getByTestId('save-event').click();

    // Torna all'elenco con la bozza.
    await expect(page).toHaveURL(/\/segreteria\/eventi$/);
    const card = await findCard(page, title);
    await expect(card.getByTestId('event-status')).toContainText('Bozza');

    // La bozza accetta dati incompleti o incoerenti, la pubblicazione no: il motivo del backend compare nell'elenco.
    await card.getByTestId('publish').click();
    await expect(page.getByTestId('manage-error')).toBeVisible();
    await expect(card.getByTestId('event-status')).toContainText('Bozza');

    // Si corregge dal modulo di modifica e poi si pubblica.
    await card.getByTestId('edit').click();
    await expect(page.getByTestId('f-title')).toHaveValue(title);
    await page.getByTestId('f-end').fill('2027-03-12');
    await expect(page.getByTestId('date-warning')).toHaveCount(0);
    await page.getByTestId('save-event').click();
    await expect(page).toHaveURL(/\/segreteria\/eventi$/);
    const fixed = await findCard(page, title);
    await fixed.getByTestId('publish').click();
    await expect(fixed.getByTestId('event-status')).not.toContainText('Bozza');

    // Ora il pubblico lo trova senza accedere.
    await page.goto('/eventi');
    await page.getByTestId('q').fill(title);
    await page.getByTestId('apply').click();
    await expect(page.locator('mat-card', { hasText: title })).toBeVisible();

    await page.goto('/segreteria/eventi');
    const again = await findCard(page, title);
    await again.getByTestId('close').click();
    await expect(again.getByTestId('event-status')).toContainText('chius');

    await again.getByTestId('cancel').click();
    await again.getByTestId('confirm-cancel').click();
    await expect(page.getByTestId('manage-error')).toBeVisible();
    await again.getByTestId('cancel-reason').fill('Maltempo');
    await again.getByTestId('confirm-cancel').click();
    await expect(again.getByTestId('event-status')).toContainText('Annullat');
  });

  test('un socio non vede la gestione eventi', async ({ page }) => {
    await loginAs(page, 'socio');
    await page.goto('/segreteria/eventi');
    await expect(page).not.toHaveURL(/segreteria\/eventi/);
  });
});
