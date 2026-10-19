import { expect, Page, test } from '@playwright/test';
import { loginAs } from './login';

async function choose(page: Page, testId: string, option: string) {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

/** Si cerca per titolo: il titolo e' unico, quindi resta una sola riga. */
async function findCard(page: Page, title: string) {
  await page.getByTestId('q').fill(title);
  await page.getByTestId('apply').click();
  const card = page.locator('tr[mat-row]', { hasText: title });
  await expect(card).toHaveCount(1);
  return card;
}

test.describe('gestione eventi della segreteria', () => {
  test('la tabella mostra gli eventi con vedi, modifica, elimina e "Nuovo evento" porta a una pagina a parte', async ({ page }) => {
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/eventi');
    await expect(page.locator('table[mat-table]')).toBeVisible();
    await expect(page.locator('tr[mat-row]').first().getByTestId('view')).toBeVisible();
    await page.getByTestId('new-event').click();
    await expect(page).toHaveURL(/\/segreteria\/eventi\/nuovo$/);
    // Il calendario si apre dall'icona e una data scelta compare nel campo.
    await page.getByRole('button', { name: 'Apri il calendario' }).first().click();
    await page.locator('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').first().click();
    await expect(page.getByTestId('f-start')).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  test('crea una bozza, la pubblica, la vede nel catalogo, chiude le iscrizioni e annulla con motivo', async ({ page }) => {
    const title = `Campo segreteria ${Date.now()}`;
    await loginAs(page, 'segreteria');
    await page.goto('/segreteria/eventi/nuovo');

    await choose(page, 'f-type', 'Campo di formazione associativa');
    await page.getByTestId('f-title').fill(title);
    await page.getByTestId('f-location').fill('Pian del Re');
    await page.getByTestId('f-province').fill('cn');
    await page.getByTestId('f-start').fill('10/03/2027');
    await page.getByTestId('f-end').fill('09/03/2027');
    // L'avviso compare subito, senza salvare; con l'ordine giusto sparisce.
    await expect(page.getByTestId('date-warning')).toContainText('rientro non può precedere');
    await page.getByTestId('f-open').fill('01/10/2026');
    await page.getByTestId('f-close').fill('01/03/2027');
    await page.getByTestId('f-seats').fill('10');
    await page.getByTestId('f-fee').fill('50');
    await choose(page, 'f-mode', 'Il socio da solo');
    await page.getByTestId('save-event').click();

    // Torna all'elenco con la bozza.
    await expect(page).toHaveURL(/\/segreteria\/eventi$/);
    const card = await findCard(page, title);
    await expect(card.getByTestId('event-status')).toContainText('Bozza');

    // La bozza accetta dati incompleti o incoerenti, la pubblicazione no: il motivo del backend compare nell'elenco.
    await card.getByTestId('more').click();
    await page.getByTestId('publish').click();
    await expect(page.getByTestId('manage-error')).toBeVisible();
    await expect(card.getByTestId('event-status')).toContainText('Bozza');

    // Si corregge dal modulo di modifica e poi si pubblica.
    await card.getByTestId('edit').click();
    await expect(page.getByTestId('f-title')).toHaveValue(title);
    await page.getByTestId('f-end').fill('12/03/2027');
    await expect(page.getByTestId('date-warning')).toHaveCount(0);
    await page.getByTestId('save-event').click();
    await expect(page).toHaveURL(/\/segreteria\/eventi$/);
    const fixed = await findCard(page, title);
    await fixed.getByTestId('more').click();
    await page.getByTestId('publish').click();
    await expect(fixed.getByTestId('event-status')).not.toContainText('Bozza');

    // Ora il pubblico lo trova senza accedere.
    await page.goto('/eventi');
    await page.getByTestId('q').fill(title);
    await page.getByTestId('apply').click();
    await expect(page.locator('.event', { hasText: title })).toBeVisible();

    await page.goto('/segreteria/eventi');
    const again = await findCard(page, title);
    await again.getByTestId('more').click();
    await page.getByTestId('close').click();
    await expect(again.getByTestId('event-status')).toContainText('chius');

    await again.getByTestId('more').click();
    await page.getByTestId('cancel').click();
    // Senza motivo il pulsante e' spento.
    await expect(page.getByTestId('confirm-cancel')).toBeDisabled();
    await page.getByTestId('cancel-reason').fill('Maltempo');
    await page.getByTestId('confirm-cancel').click();
    await expect(again.getByTestId('event-status')).toContainText('Annullat');
  });

  test('un socio non vede la gestione eventi', async ({ page }) => {
    await loginAs(page, 'socio');
    await page.goto('/segreteria/eventi');
    await expect(page).not.toHaveURL(/segreteria\/eventi/);
  });
});
