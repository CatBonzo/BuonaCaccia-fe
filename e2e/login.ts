import { Page } from '@playwright/test';

/** Entra dalla pagina di accesso di prova, come farebbe una persona. */
export async function loginAs(page: Page, username: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: `Entra come ${username}`, exact: true }).first().click();
}
