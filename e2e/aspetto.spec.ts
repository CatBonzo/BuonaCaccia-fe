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
});
