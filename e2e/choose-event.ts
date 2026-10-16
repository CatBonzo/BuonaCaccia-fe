import { expect, Page } from '@playwright/test';

/**
 * Sceglie un evento dal menu delle pagine della segreteria. Il menu non si apre finche' l'elenco non e'
 * arrivato, quindi si riprova ad aprirlo invece di cliccare una volta sola subito dopo il caricamento.
 */
export async function chooseEvent(page: Page, title: string): Promise<void> {
  const option = page.getByRole('option', { name: new RegExp(title) });
  await expect(async () => {
    if (!(await option.isVisible())) await page.getByTestId('event').click();
    await expect(option).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 20_000 });
  await option.click();
}
