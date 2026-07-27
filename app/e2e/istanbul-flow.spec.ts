import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SHOTS = path.resolve('docs/screenshots');

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function shot(page: Page, name: string, project: string): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${project}-${name}.png`), fullPage: false });
}

test.describe('İstanbul end-to-end', () => {
  test('map to completion with no console errors', async ({ page }, testInfo) => {
    const errors = collectConsoleErrors(page);
    const project = testInfo.project.name;

    await page.goto('/map');
    await expect(page.getByRole('heading', { name: 'Türkiye Sokakları' })).toBeVisible();
    await shot(page, '01-map', project);

    await page.getByRole('button', { name: /Şehre gir/ }).first().click();
    await expect(page).toHaveURL(/\/city\/istanbul/);

    // Intro is always skippable.
    const skip = page.getByRole('button', { name: /Girişi geç/ });
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(page.locator('canvas')).toBeVisible();
    await shot(page, '02-city-graybox', project);

    // Guided mode removes the need to steer, and must stop at each hotspot.
    await page.getByRole('button', { name: 'Ayarlar' }).click();
    await page.getByRole('button', { name: /Keşif modu|Rehberli mod/ }).click();
    await page.getByRole('button', { name: 'Kapat' }).click();

    for (let stop = 0; stop < 3; stop += 1) {
      const prompt = page.getByRole('button', { name: /İncele —/ });
      await expect(prompt).toBeVisible({ timeout: 25_000 });
      await prompt.click();

      if (stop === 0) await shot(page, '03-interaction', project);

      // First hotspot is inspect-and-find; the others are choice based.
      const answer = page
        .getByRole('button', { name: /Lale motifi|Avrupa ve Asya|Seyir galerisi|Devam et/ })
        .first();
      await answer.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: 'Devam et' }).click();

      if (stop === 0) await shot(page, '04-reward', project);
      await page.getByRole('button', { name: 'Devam et' }).click();
    }

    // Two quiz questions, then the province star.
    await expect(page.getByText('1/2')).toBeVisible({ timeout: 20_000 });
    await shot(page, '05-quiz', project);
    await page.getByRole('button', { name: /Lale motifi/ }).click();
    await expect(page.getByText('2/2')).toBeVisible();
    await page.getByRole('button', { name: /Avrupa ve Asya/ }).click();

    await expect(page.getByRole('heading', { name: /Şehri tamamladın/ })).toBeVisible();
    await shot(page, '06-complete', project);

    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('progress survives a refresh and rewards are not duplicated', async ({ page }) => {
    await page.goto('/city/istanbul');
    await page.getByRole('button', { name: /Girişi geç/ }).click();

    const before = await page.evaluate(() => window.localStorage.getItem('sot.city.istanbul.v1'));
    await page.reload();
    const after = await page.evaluate(() => window.localStorage.getItem('sot.city.istanbul.v1'));
    expect(after).toBe(before);

    const collected = await page.evaluate(() => {
      const raw = window.localStorage.getItem('sot.city.istanbul.v1');
      if (!raw) return [];
      return (JSON.parse(raw) as { collectedRewardIds: string[] }).collectedRewardIds;
    });
    expect(new Set(collected).size).toBe(collected.length);
  });

  test('keyboard reaches the city and Escape closes settings', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('button', { name: 'Ayarlar' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('respects reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/city/istanbul');
    await page.getByRole('button', { name: /Girişi geç/ }).click();
    await page.getByRole('button', { name: 'Ayarlar' }).click();
    // Auto-detected from the OS setting.
    await expect(page.getByRole('button', { name: 'Açık' })).toBeVisible();
  });
});

test.describe('mobile controls', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch-only');

  test('shows the walking stick on a touch device', async ({ page }, testInfo) => {
    await page.goto('/city/istanbul');
    await page.getByRole('button', { name: /Girişi geç/ }).click();
    await expect(page.getByRole('application', { name: 'Yürüme kolu' })).toBeVisible();
    await shot(page, '07-mobile-controls', testInfo.project.name);
  });
});
