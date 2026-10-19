import { expect, test } from '@playwright/test';
import { API, tokenOf } from './api';
import { loginAs } from './login';

/** Codice unico di sole lettere maiuscole: i tipi non si cancellano, ogni scenario ne crea uno nuovo. */
function uniqueCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let n = Date.now();
  let code = 'Z';
  for (let i = 0; i < 6; i++) {
    code += letters[n % 26];
    n = Math.floor(n / 26);
  }
  return code;
}

test.describe('amministrazione', () => {
  test('crea un tipo di evento, lo modifica e lo disattiva', async ({ page }) => {
    const code = uniqueCode();
    await loginAs(page, 'amministratore');
    await page.goto('/amministrazione/tipi-evento');

    await page.getByTestId('type-new').click();
    await page.getByTestId('type-save').click();
    await expect(page.getByTestId('type-error')).toBeVisible();

    await page.getByTestId('type-code').fill(code);
    await page.getByTestId('type-min-age').fill('12');
    await page.getByTestId('add-obligation').click();
    await page.getByTestId('type-save').click();

    const card = page.locator(`mat-card[data-type="${code}"]`);
    await expect(card).toContainText(code);
    await expect(card.getByTestId('type-status')).toContainText('Attivo');
    await expect(card).toContainText('Adempimenti: 1');

    await card.getByTestId('type-edit').click();
    await page.getByText('È una candidatura').click();
    await page.getByTestId('type-save').click();
    await expect(card).toContainText('Candidatura');

    await card.getByTestId('type-deactivate').click();
    await card.getByTestId('type-confirm-deactivate').click();
    await expect(card.getByTestId('type-status')).toContainText('Disattivato');
  });

  test('scrive la scheda di un tipo e la ritrova dopo il ricaricamento', async ({ page, request }) => {
    const code = uniqueCode();
    const headers = { Authorization: `Bearer ${await tokenOf(request, 'amministratore')}` };
    const created = await request.post(`${API}/api/v1/event-types`, {
      headers,
      data: { code, name: `Tipo ${code}`, category: 'RS', application: false, defaultRequirements: {}, defaultObligations: [] },
    });
    expect(created.status()).toBe(201);

    await loginAs(page, 'amministratore');
    await page.goto(`/amministrazione/tipi-evento/${code}/scheda`);
    await expect(page.getByTestId('template-empty')).toBeVisible();
    await page.getByTestId('add-section').click();
    await page.getByTestId('section-title').fill('Su di te');
    await page.getByTestId('add-question').click();
    await page.getByTestId('question-text').fill('Cosa ti aspetti?');
    await page.getByTestId('question-required').click();
    await page.getByTestId('template-save').click();

    await page.reload();
    await expect(page.getByTestId('section-title')).toHaveValue('Su di te');
    await expect(page.getByTestId('question-text')).toHaveValue('Cosa ti aspetti?');
  });

  test('la segreteria cura le coordinate di pagamento della propria regione', async ({ page }) => {
    await loginAs(page, 'segreteria');
    await expect(page.getByRole('link', { name: 'Tipi di evento' })).toHaveCount(0);
    await page.goto('/segreteria/coordinate');
    await expect(page.getByTestId('region')).toHaveCount(0);
    await page.getByTestId('holder').fill('AGESCI Piemonte');
    await page.getByTestId('iban').fill('IT60X0542811101000000123456');
    await page.getByTestId('settings-save').click();

    await page.reload();
    await expect(page.getByTestId('holder')).toHaveValue('AGESCI Piemonte');
    await expect(page.getByTestId('iban')).toHaveValue('IT60X0542811101000000123456');

    // L'amministrazione sceglie la regione.
    await loginAs(page, 'amministratore');
    await page.goto('/segreteria/coordinate');
    await expect(page.getByTestId('region')).toBeVisible();
  });
});
