import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createBrowserAuditSeed } from './helpers.js';
import fs from 'node:fs';
test('desktop navigation collapse and expand remain keyboard accessible', async ({ page }) => {
  await page.addInitScript(
    (s) => localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s)),
    createBrowserAuditSeed('member'),
  );
  await page.goto('/portal/dashboard');
  await page.getByRole('button', { name: 'Collapse navigation' }).click();
  expect((await page.getByRole('complementary').boundingBox()).width).toBe(80);
  await page.getByRole('button', { name: 'Expand navigation' }).click();
  expect((await page.getByRole('complementary').boundingBox()).width).toBe(248);
});
test('scanner rendered success and rejection at both widths, hardware feedback invocation', async ({
  browser,
}) => {
  fs.mkdirSync('artifacts/screenshots', { recursive: true });
  const results = [];
  for (const [width, height, name] of [
    [1440, 1000, 'desktop'],
    [390, 844, 'mobile'],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } }),
      page = await context.newPage();
    await page.addInitScript((s) => {
      localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s));
      window.__haptics = [];
      navigator.vibrate = (pattern) => {
        window.__haptics.push(pattern);
        return true;
      };
      window.__tones = [];
      class MockAudio {
        currentTime = 0;
        destination = {};
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
        createOscillator() {
          const obj = {
            type: 'sine',
            frequency: { value: 0 },
            connect() {},
            start() {
              window.__tones.push({ frequency: obj.frequency.value, type: obj.type });
            },
            stop() {},
          };
          return obj;
        }
        createGain() {
          return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
        }
      }
      window.AudioContext = MockAudio;
    }, createBrowserAuditSeed('president'));
    await page.goto('/scanner/gala');
    await page.waitForLoadState('networkidle');
    const frame = await page.getByTestId('scanner-reticle').boundingBox();
    expect(frame.width).toBe(280);
    expect(frame.height).toBe(280);
    expect(frame.x + 140).toBe(width / 2);
    expect(frame.y + 140).toBe(height / 2);
    await page.getByLabel('Ticket or membership code').fill('TCK-SKY-1001');
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
    await expect(page.getByLabel('Successful verification')).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `artifacts/screenshots/scanner-success-${name}.png` });
    const success = await page.evaluate(() => ({
      tone: window.__tones[0],
      haptic: window.__haptics[0],
      live: document.querySelector('[aria-live="assertive"]').textContent,
      border: getComputedStyle(document.querySelector('.reticle')).borderColor,
    }));
    expect(success.tone).toEqual({ frequency: 440, type: 'sine' });
    expect(success.haptic).toBe(50);
    expect(success.border).toBe('rgb(30, 142, 62)');
    await page.waitForTimeout(1250);
    await page.getByLabel('Ticket or membership code').fill('TCK-SKY-1001');
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'ALREADY CHECKED IN' })).toBeVisible();
    await page.screenshot({ path: `artifacts/screenshots/scanner-rejection-${name}.png` });
    const rejected = await page.evaluate(() => ({
      tone: window.__tones[1],
      haptic: window.__haptics[1],
      border: getComputedStyle(document.querySelector('.reticle')).borderColor,
    }));
    expect(rejected.haptic).toEqual([100, 50, 100, 50, 100]);
    expect(rejected.tone.frequency).toBe(180);
    expect(rejected.border).toBe('rgb(217, 48, 37)');
    const a11y = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    results.push({
      viewport: name,
      frame,
      success,
      rejected,
      violations: a11y.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    });
    await context.close();
  }
  fs.writeFileSync('artifacts/scanner-audit.json', JSON.stringify(results, null, 2));
  expect(results.flatMap((r) => r.violations)).toEqual([]);
});
test('ledger hover/selected treatment and visible focus outline', async ({ page }) => {
  await page.addInitScript(
    (s) => localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s)),
    createBrowserAuditSeed('treasurer'),
  );
  await page.goto('/dashboard/skyline/ledger');
  await page.waitForLoadState('networkidle');
  const row = page.locator('.ledger tbody tr').first();
  expect(await row.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
  await row.hover();
  expect(await row.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(248, 250, 252)');
  await row.getByRole('button').click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  expect(await row.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(232, 240, 254)');
  const first = page.getByRole('button', { name: 'Export ledger CSV' });
  await first.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const focus = await first.evaluate((e) => ({
    width: getComputedStyle(e).outlineWidth,
    color: getComputedStyle(e).outlineColor,
    offset: getComputedStyle(e).outlineOffset,
  }));
  expect(focus).toEqual({ width: '2px', color: 'rgb(26, 115, 232)', offset: '2px' });
  await page.screenshot({
    path: 'artifacts/screenshots/ledger-selected-desktop.png',
    fullPage: true,
  });
});
test('drag lift and drop-zone feedback; reduced-motion alternatives', async ({ page }) => {
  await page.addInitScript(
    (s) => localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s)),
    createBrowserAuditSeed('president'),
  );
  await page.goto('/dashboard/skyline/tasks');
  await page.waitForLoadState('networkidle');
  const card = page.locator('.task-card').filter({ hasText: 'Buy baking supplies' }),
    target = page.getByRole('region', { name: 'IN_PROGRESS column' }),
    transfer = await page.evaluateHandle(() => new DataTransfer());
  await card.dispatchEvent('dragstart', { dataTransfer: transfer });
  await expect(card).toHaveClass(/dragging/);
  const lift = await card.evaluate((e) => ({
    transform: getComputedStyle(e).transform,
    shadow: getComputedStyle(e).boxShadow,
    cursor: getComputedStyle(e).cursor,
  }));
  expect(lift.cursor).toBe('grabbing');
  expect(lift.transform).toContain('1.02');
  await target.dispatchEvent('dragover', { dataTransfer: transfer });
  await expect(target).toHaveClass(/drag-over/);
  expect(await target.evaluate((e) => getComputedStyle(e).borderStyle)).toBe('dashed');
  await page.screenshot({ path: 'artifacts/screenshots/kanban-drag-desktop.png', fullPage: true });
  await target.dispatchEvent('drop', { dataTransfer: transfer });
  await expect(target.getByRole('heading', { name: 'Buy baking supplies' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/scanner/gala');
  expect(await page.locator('.laser').evaluate((e) => getComputedStyle(e).animationName)).toBe(
    'none',
  );
});
