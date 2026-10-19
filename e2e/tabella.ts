import { Page } from '@playwright/test';

/** Scrive nel filtro del nome di Gestione eventi e aspetta che l'elenco sia stato ricaricato dal backend (la ricerca parte dopo una breve pausa). */
export async function filterByName(page: Page, text: string): Promise<void> {
  const filtered = page.waitForResponse((r) => r.url().includes('/events/managed') && r.url().includes('q='));
  await page.getByTestId('q').fill(text);
  await filtered;
}
