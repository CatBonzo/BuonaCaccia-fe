import { expect, test } from '@playwright/test';
import { createDraft, enrollId, publishRoverEvent, withdrawAll } from './api';
import { loginAs } from './login';

test.describe('domande della scheda di un evento', () => {
  test('la segreteria scrive le domande, chiede scheda medica e intolleranze e le ritrova dopo il salvataggio', async ({ page, request }) => {
    const draft = await createDraft(request, `domande${Date.now()}`);
    await loginAs(page, 'segreteria');
    await page.goto(`/segreteria/eventi/${draft.id}/modifica`);

    // Le domande sono facoltative: all'inizio non ce n'e' nessuna.
    await expect(page.getByTestId('domande-vuote')).toBeVisible();
    await page.getByTestId('add-section').click();
    await page.getByTestId('question-text').fill('Cosa ti aspetti dalla route?');
    await page.getByTestId('f-medical').click();
    await page.getByTestId('f-dietary').click();
    await page.getByTestId('save-event').click();
    await expect(page).toHaveURL(/\/segreteria\/eventi$/);

    await page.goto(`/segreteria/eventi/${draft.id}/modifica`);
    await expect(page.getByTestId('question-text')).toHaveValue('Cosa ti aspetti dalla route?');
    await expect(page.locator('[data-testid="f-medical"] input')).toBeChecked();
    await expect(page.locator('[data-testid="f-dietary"] input')).toBeChecked();
  });

  test('il socio vede le domande dell\'evento, intolleranze e allergie comprese', async ({ page, request }) => {
    await withdrawAll(request, 'rover');
    const event = await publishRoverEvent(request, `domande${Date.now()}`, 5, {
      formSections: [{ title: 'Su di te', questions: [{ id: 'meta', text: 'Dove vuoi arrivare?', type: 'LONG_TEXT', required: false, sensitive: false }] }],
      dietaryInfoRequired: true,
      medicalFormRequired: true,
    });
    const enrollment = await enrollId(request, 'rover', event.id);
    await loginAs(page, 'rover');
    await page.goto(`/eventi/${event.id}`);
    await expect(page.getByTestId('form-questions')).toContainText('Dove vuoi arrivare?');
    await expect(page.getByTestId('form-questions')).toContainText('Allergie');

    await page.goto(`/iscrizioni/${enrollment}/scheda`);
    await expect(page.locator('[data-question="meta"] textarea')).toBeVisible();
    await expect(page.locator('[data-question="intolleranze"] input')).toBeVisible();
    await expect(page.locator('[data-question="allergie"] input')).toBeVisible();
  });
});
