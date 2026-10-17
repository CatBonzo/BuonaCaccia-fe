import { expect, test } from '@playwright/test';
import { publishEvent } from './api';

test.describe('catalogo eventi', () => {
  test('si trova un evento cercandolo per titolo e se ne apre il dettaglio', async ({ page, request }) => {
    const tag = `cerca${Date.now()}`;
    const event = await publishEvent(request, tag);

    await page.goto('/eventi');
    await page.getByTestId('q').fill(tag);
    await page.getByTestId('apply').click();
    await expect(page.locator('.event')).toHaveCount(1);
    await expect(page.locator('.event')).toContainText(event.title);

    await page.getByRole('link', { name: event.title }).click();
    await expect(page.getByTestId('title')).toHaveText(event.title);
    await expect(page.getByTestId('seats')).toContainText('10 liberi su 10');
    await expect(page.getByText('Quota di partecipazione')).toBeVisible();
  });

  test('un testo senza risultati lo dice', async ({ page }) => {
    await page.goto('/eventi');
    await page.getByTestId('q').fill(`nessuno${Date.now()}`);
    await page.getByTestId('apply').click();
    await expect(page.getByTestId('empty')).toBeVisible();
  });

  test('il filtro per regione esclude gli eventi delle altre', async ({ page, request }) => {
    const tag = `regione${Date.now()}`;
    await publishEvent(request, tag);

    await page.goto('/eventi');
    await page.getByTestId('q').fill(tag);
    await page.getByTestId('region').click();
    await page.getByRole('option', { name: 'Liguria' }).click();
    await page.getByTestId('apply').click();
    await expect(page.getByTestId('empty')).toBeVisible();

    await page.getByTestId('region').click();
    await page.getByRole('option', { name: 'Piemonte' }).click();
    await page.getByTestId('apply').click();
    await expect(page.locator('.event')).toHaveCount(1);
  });

  test('un evento che non esiste mostra un messaggio chiaro', async ({ page }) => {
    await page.goto('/eventi/id-che-non-esiste');
    await expect(page.getByTestId('not-found')).toBeVisible();
  });
});
