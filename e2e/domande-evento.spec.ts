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

  test('evento con la sola scheda medica e le intolleranze: dalle iscrizioni il socio compila, salva in bozza e invia', async ({ page, request }) => {
    await withdrawAll(request, 'rover');
    const event = await publishRoverEvent(request, `solo-spunte${Date.now()}`, 5, { dietaryInfoRequired: true, medicalFormRequired: true });
    await loginAs(page, 'rover');
    await page.goto(`/eventi/${event.id}`);
    await page.getByRole('button', { name: /Iscriviti/ }).first().click();

    await page.goto('/iscrizioni');
    const card = page.locator('mat-card', { hasText: event.title });
    await expect(card.getByTestId('form-state')).toContainText('Da iniziare');
    await card.getByTestId('open-form').click();

    await expect(page.locator('[data-question="intolleranze"]')).toBeVisible();
    await page.locator('[data-question="intolleranze"] input, [data-question="intolleranze"] textarea').first().fill('Lattosio');
    await page.getByTestId('save-form').click();
    await page.reload();
    await expect(page.locator('[data-question="intolleranze"] input, [data-question="intolleranze"] textarea').first()).toHaveValue('Lattosio');

    await page.locator('[data-question="allergie"] input, [data-question="allergie"] textarea').first().fill('Nessuna');
    await page.getByTestId('submit-form').click();
    await expect(page.getByTestId('form-status')).toContainText('Scheda inviata');
  });
});
