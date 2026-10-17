import { expect, test } from '@playwright/test';
import { publishEvent } from './api';

test.describe('home ed eventi con le carte', () => {
  test('la home non ha la ricerca, mostra carte di eventi e porta alla pagina Eventi', async ({ page, request }) => {
    await publishEvent(request, `home${Date.now()}`);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Buona caccia!' })).toBeVisible();
    await expect(page.getByTestId('q')).toHaveCount(0);
    await expect(page.locator('.event').first()).toBeVisible();
    expect(await page.locator('.event').count()).toBeLessThanOrEqual(3);
    await expect(page.getByRole('heading', { name: 'Cerca, iscriviti, completa' })).toBeVisible();

    await page.getByTestId('cta-eventi').click();
    await expect(page).toHaveURL(/\/eventi$/);
    await expect(page.getByTestId('q')).toBeVisible();
  });

  test('la carta mostra tipo, luogo, date, posti e quota e apre il dettaglio', async ({ page, request }) => {
    const tag = `carta${Date.now()}`;
    const event = await publishEvent(request, tag);

    await page.goto('/eventi');
    await page.getByTestId('q').fill(tag);
    await page.getByTestId('apply').click();
    const card = page.locator('.event');
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(event.title);
    await expect(card).toContainText('Pian del Re');
    await expect(card).toContainText('posti disponibili');
    await expect(card).toContainText('Dettagli');

    await card.getByRole('link', { name: event.title }).click();
    await expect(page.getByTestId('title')).toHaveText(event.title);
  });

  test('il piede e\' in pagina su Home, Eventi e Aiuto', async ({ page }) => {
    for (const path of ['/', '/eventi', '/aiuto']) {
      await page.goto(path);
      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Collegamenti del piede' })).toBeVisible();
    }
  });
});

test('ogni carta ha i badge del tipo di evento, della tipologia e del livello', async ({ page }) => {
  await page.goto('/eventi');
  const card = page.locator('.event').first();
  await expect(card.getByTestId('tag-type')).not.toBeEmpty();
  await expect(card.getByTestId('tag-category')).not.toBeEmpty();
  await expect(card.getByTestId('tag-level')).not.toBeEmpty();
});
