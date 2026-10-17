import { expect, test } from '@playwright/test';

test('il catalogo e\' pubblico, il login e\' a un clic', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Buona caccia!' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Accedi', exact: true }).first()).toBeVisible();
  await page.getByTestId('login').click();
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

test('il login con email e password di prova', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('email').fill('nessuno@esempio.it');
  await page.getByTestId('password').fill('qualunque');
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('form-error')).toContainText('Non trovo questo utente');

  await page.getByTestId('email').fill('socio@buonacaccia.local');
  await page.getByTestId('password').fill('');
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('form-error')).toContainText('Scrivi email e password');

  await page.getByTestId('password').fill('qualunque');
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/eventi$/);
  await expect(page.getByTestId('who')).toBeVisible();
});

test('password dimenticata, registrazione e Google sono finte ma rispondono', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('forgot').click();
  await expect(page.getByRole('status')).toContainText('non e\' disponibile');
  await page.getByTestId('google').click();
  await expect(page.getByTestId('who')).toBeVisible();
});
