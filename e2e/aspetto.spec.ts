import { expect, test } from '@playwright/test';
import { loginAs } from './login';

test.describe('aspetto e menu', () => {
  test('sul telefono il menu si apre dal pulsante e si chiude dopo aver scelto una pagina', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await loginAs(page, 'socio');
    await page.goto('/eventi');

    await expect(page.getByRole('link', { name: 'Le mie iscrizioni' })).toBeHidden();
    await page.getByTestId('menu-toggle').click();
    await page.getByRole('link', { name: 'Le mie iscrizioni' }).click();
    await expect(page).toHaveURL(/\/iscrizioni$/);
    await expect(page.getByRole('link', { name: 'Le mie iscrizioni' })).toBeHidden();
  });

  test('chi non ha fatto l’accesso non vede un menu con una sola voce', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/eventi');
    await expect(page.getByTestId('menu-toggle')).toHaveCount(0);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('navigation', { name: 'Menu principale' })).toBeHidden();
  });

  test('il tema si sceglie dal pulsante e resta anche dopo aver ricaricato la pagina', async ({ page }) => {
    await page.goto('/eventi');
    const html = page.locator('html');
    await page.getByTestId('theme').click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('theme').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.getByTestId('theme').click();
    await expect(html).not.toHaveAttribute('data-theme', /.+/);
  });

  test('la barra in alto mostra Home, Eventi, Aiuto e Info anche a chi non ha fatto l’accesso, con Accedi a destra', async ({ page }) => {
    await page.goto('/eventi');
    const links = page.getByRole('navigation', { name: 'Navigazione del sito' });
    for (const name of ['Home', 'Eventi', 'Aiuto', 'Info']) {
      await expect(links.getByRole('link', { name, exact: true })).toBeVisible();
    }
    const info = await links.getByRole('link', { name: 'Info', exact: true }).boundingBox();
    const login = await page.getByTestId('login').boundingBox();
    expect(login!.x).toBeGreaterThan(info!.x + info!.width);

    await links.getByRole('link', { name: 'Aiuto', exact: true }).click();
    await expect(page).toHaveURL(/\/aiuto$/);
    await expect(page.getByRole('heading', { name: 'Come funziona?' })).toBeVisible();
    await expect(links.getByRole('link', { name: 'Aiuto', exact: true })).toHaveAttribute('aria-current', 'page');

    await links.getByRole('link', { name: 'Info', exact: true }).click();
    await expect(page).toHaveURL(/\/info$/);
    await expect(page.getByRole('heading', { name: /Che cos'è Buona Caccia/ })).toBeVisible();

    await links.getByRole('link', { name: 'Eventi', exact: true }).click();
    await expect(page).toHaveURL(/\/eventi$/);
    await expect(links.getByRole('link', { name: 'Eventi', exact: true })).toHaveAttribute('aria-current', 'page');

    await links.getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page).toHaveURL(/\/eventi$/);
  });

  test('chi è entrato vede le stesse voci nella barra e il suo nome a destra', async ({ page }) => {
    await loginAs(page, 'socio');
    const links = page.getByRole('navigation', { name: 'Navigazione del sito' });
    await expect(links.getByRole('link', { name: 'Eventi', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Le mie iscrizioni' }).click();
    await expect(page).toHaveURL(/\/iscrizioni$/);
    await expect(page.getByTestId('who')).toBeVisible();
    await expect(page.getByTestId('login')).toHaveCount(0);
  });
});
