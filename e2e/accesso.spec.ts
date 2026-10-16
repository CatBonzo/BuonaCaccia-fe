import { expect, test } from '@playwright/test';

test('il catalogo e\' pubblico, il login e\' a un clic', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/eventi$/);
  await expect(page.getByRole('link', { name: 'Accedi' })).toBeVisible();
  await page.getByRole('link', { name: 'Accedi' }).click();
  await expect(page.getByRole('button', { name: /Entra come socio$/ })).toBeVisible();
});

test('la sezione riservata chiede il login', async ({ page }) => {
  await page.goto('/profilo');
  await expect(page).toHaveURL(/\/login$/);
});

test('la segreteria vede le voci di gestione, il socio no', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entra come segreteria', exact: true }).click();
  await expect(page.getByTestId('who')).toContainText('Sergio Segretario');
  await expect(page.getByRole('link', { name: 'Gestione eventi' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tipi di evento' })).toHaveCount(0);

  await page.getByTestId('logout').click();
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entra come socio', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Le mie iscrizioni' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gestione eventi' })).toHaveCount(0);
});

test('il token arriva al backend: /users/me risponde con il profilo', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entra come amministratore', exact: true }).click();
  const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem('buonacaccia.session')!).accessToken);
  const response = await page.request.get('http://localhost:8080/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } });
  expect(response.status()).toBe(200);
  expect((await response.json()).payload.username).toBe('amministratore');
});
