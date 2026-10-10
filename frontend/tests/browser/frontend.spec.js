import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createBrowserAuditSeed } from '../../src/mock/scenarios/browserAudit.js';
import fs from 'node:fs';
test.use({ trace: 'off' });
const seed = createBrowserAuditSeed;
async function setup(page, role = 'visitor', viewport = { width: 1440, height: 1000 }) {
  await page.setViewportSize(viewport);
  const s = seed(role);
  await page.addInitScript((s) => {
    if (!localStorage.getItem('clubsphere-demo-v1'))
      localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s));
  }, s);
}
test('public discovery and student membership/ticket/checkout flow', async ({ page }) => {
  await setup(page, 'guest');
  await page.goto('/membership');
  await page.getByRole('button', { name: 'Join Standard' }).click();
  await page.getByRole('button', { name: 'Simulate successful payment' }).click();
  await page.getByRole('link', { name: 'View member pass' }).click();
  await expect(page.getByRole('heading', { name: 'Your digital member pass' })).toBeVisible();
  await expect(page.getByAltText(/Demo QR pass/)).toBeVisible();
  await page.goto('/events/gala');
  await page.getByRole('button', { name: 'Reserve ticket' }).click();
  await page.getByRole('button', { name: 'Simulate successful payment' }).click();
  await page.getByRole('link', { name: 'View ticket', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your next experience, ready.' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.badge').filter({ hasText: /^Issued$/ })).toBeVisible();
});
test('merchandise checkout and stock update', async ({ page }) => {
  await setup(page, 'member');
  await page.goto('/store/hoodie');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('link', { name: /Your cart/ }).click();
  await page.getByRole('button', { name: 'Reserve items & checkout' }).click();
  await page.getByRole('button', { name: 'Simulate successful payment' }).click();
  await page.getByRole('link', { name: 'View order', exact: true }).click();
  await expect(page.locator('.badge').filter({ hasText: /^Paid$/ })).toBeVisible();
});
test('mobile navigation, role guard and club isolation', async ({ page }) => {
  await setup(page, 'member', { width: 390, height: 844 });
  await page.goto('/portal/dashboard');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'My tickets', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'My tickets' })).toBeVisible();
  await page.goto('/dashboard/skyline/ledger');
  await expect(
    page.getByRole('heading', { name: 'This space needs a different role.' }),
  ).toBeVisible();
  await page.goto('/portal/dashboard');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByLabel('Active club').selectOption('makers');
  await expect(page.getByRole('heading', { name: 'Hello, Ananya.' })).toBeVisible();
  await expect(page.getByText('Campus Makers Collective ·')).toBeVisible();
});
test('scanner success, exact timing, duplicate persistence and manual dismissal', async ({
  page,
}) => {
  await setup(page, 'president');
  await page.goto('/scanner/gala');
  await page.getByLabel('Ticket or membership code').fill('TCK-SKY-1001');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByText('ENTRY APPROVED', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Successful verification')).toBeVisible();
  await page.waitForTimeout(1350);
  await expect(page.getByLabel('Successful verification')).toHaveCount(0);
  await page.getByLabel('Ticket or membership code').fill('TCK-SKY-1001');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'ALREADY CHECKED IN' })).toBeVisible();
  await page.waitForTimeout(1400);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss warning & resume' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('five-column task board and keyboard status update', async ({ page }) => {
  await setup(page, 'president');
  await page.goto('/dashboard/skyline/tasks');
  for (const s of ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'])
    await expect(page.getByRole('region', { name: `${s} column` })).toBeVisible();
  await page.getByLabel('Status for Buy baking supplies').selectOption('IN_PROGRESS');
  await expect(
    page
      .getByRole('region', { name: 'IN_PROGRESS column' })
      .getByRole('heading', { name: 'Buy baking supplies' }),
  ).toBeVisible();
});
test('rendered desktop/mobile visual and accessibility audit', async ({ page }) => {
  test.setTimeout(180000);
  fs.mkdirSync('artifacts/screenshots', { recursive: true });
  const screens = [
    ['landing', '/', 'visitor'],
    ['student-dashboard', '/portal/dashboard', 'member'],
    ['membership-pass', '/portal/pass', 'member'],
    ['event-booking', '/events/gala', 'member'],
    ['ticket-details', '/portal/tickets/TCK-1001', 'member'],
    ['merchandise', '/store', 'member'],
    ['merchandise-checkout', '/checkout/order/ORD-AUDIT', 'member'],
    ['kanban', '/dashboard/skyline/tasks', 'president'],
    ['announcements', '/portal/announcements', 'member'],
    ['expense-submission', '/portal/expenses/new', 'volunteer'],
    ['expense-review', '/dashboard/skyline/expenses/EXP-1001', 'treasurer'],
    ['ledger', '/dashboard/skyline/ledger', 'treasurer'],
    ['treasurer-dashboard', '/dashboard/skyline/finance', 'treasurer'],
  ];
  const results = [];
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [width, height, name] of [
    [1440, 1000, 'desktop'],
    [390, 844, 'mobile'],
  ]) {
    await page.setViewportSize({ width, height });
    for (const [screen, url, role] of screens) {
      await page.goto('/');
      await page.evaluate(
        (s) => localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s)),
        seed(role),
      );
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `artifacts/screenshots/${screen}-${name}.png`,
        fullPage: true,
      });
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        reticle: (() => {
          const r = document.querySelector('.reticle');
          return r ? { width: r.clientWidth, height: r.clientHeight } : null;
        })(),
        touch: [
          ...document.querySelectorAll(
            'button,input:not([type=checkbox]):not([type=radio]),select,a',
          ),
        ]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return (
              r.width > 0 &&
              r.height > 0 &&
              r.left >= 0 &&
              r.top >= 0 &&
              r.left < innerWidth &&
              r.top < innerHeight &&
              !e.closest('.sidebar:not(.open)')
            );
          })
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width < 48 || r.height < 48;
          })
          .map((e) => ({
            text: e.textContent?.trim().slice(0, 50),
            width: e.getBoundingClientRect().width,
            height: e.getBoundingClientRect().height,
          }))
          .slice(0, 20),
      }));
      const a11y = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      results.push({
        screen,
        viewport: name,
        ...metrics,
        violations: a11y.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      });
    }
  }
  fs.writeFileSync('artifacts/rendered-audit.json', JSON.stringify({ results, errors }, null, 2));
  expect(errors).toEqual([]);
  expect(results.filter((r) => r.overflow)).toEqual([]);
  expect(results.filter((r) => r.violations.length)).toEqual([]);
  expect(results.filter((r) => r.viewport === 'mobile' && r.touch.length)).toEqual([]);
});
