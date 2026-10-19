import { Page } from '@playwright/test';

/** Scrive nel filtro del titolo di Gestione eventi: la tabella filtra da sola, non c'e' nulla da aspettare dal backend. */
export async function filterByName(page: Page, text: string): Promise<void> {
  await page.getByLabel('Filtra per titolo').fill(text);
}
