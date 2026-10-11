import { test, expect } from '@playwright/test';
import { createBrowserAuditSeed } from './helpers.js';
import fs from 'node:fs';
test('Treasurer closes the semester by exporting the balanced ledger', async ({ page }) => {
  await page.addInitScript((s) => {
    localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s));
  }, createBrowserAuditSeed('treasurer'));
  await page.goto('/dashboard/skyline/ledger');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export ledger CSV' }).click();
  const download = await downloadPromise;
  fs.mkdirSync('artifacts/exports', { recursive: true });
  await download.saveAs('artifacts/exports/semester-ledger.csv');
  const text = fs.readFileSync('artifacts/exports/semester-ledger.csv', 'utf8');
  expect(text).toContain('Debit (paise)');
  expect(text).toContain('Credit (paise)');
  expect(text).toContain('Annual membership dues');
  expect(text).toContain('Bake sale opening donations');
});
test('announcement Markdown preview, publication, delivery and student read', async ({ page }) => {
  await page.addInitScript((s) => {
    if (!localStorage.getItem('clubsphere-demo-v1'))
      localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s));
  }, createBrowserAuditSeed('president'));
  await page.goto('/dashboard/skyline/announcements');
  await page.getByRole('button', { name: 'Compose announcement' }).click();
  await page.getByLabel('Announcement title').fill('Our club meeting');
  await page.getByLabel('Markdown content').fill('## See you there\n\nBring **your ideas**.');
  await page.getByRole('button', { name: 'Preview Markdown' }).click();
  await expect(page.getByRole('heading', { name: 'See you there' })).toBeVisible();
  await page.getByRole('button', { name: 'Save announcement' }).click();
  const article = page.locator('article').filter({ hasText: 'Our club meeting' });
  await article.getByRole('button', { name: 'Publish announcement' }).click();
  await expect(article.getByRole('button', { name: 'Mark as read' })).toBeVisible();
  await article.getByRole('button', { name: 'Delivery report' }).click();
  await page.getByRole('button', { name: /Advance queued/ }).click();
  await page.getByRole('button', { name: /Advance queued/ }).click();
  await expect(
    page.getByRole('dialog').getByText('Delivered', { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByLabel('Demo account').selectOption('member');
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('clubsphere-demo-v1')).session.userId === 'member',
  );
  await page.goto('/portal/announcements');
  const update = page.locator('article').filter({ hasText: 'Our club meeting' });
  await update.getByRole('button', { name: 'Mark as read' }).click();
  await expect(update.getByRole('button', { name: 'Read', exact: true })).toBeDisabled();
});
test('receipt upload, independent approval and simulated payout via UI', async ({ page }) => {
  await page.addInitScript((s) => {
    if (!localStorage.getItem('clubsphere-demo-v1'))
      localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s));
  }, createBrowserAuditSeed('volunteer'));
  await page.goto('/portal/expenses/new');
  await page.getByLabel('Expense title').fill('Workshop supplies');
  await page.getByLabel('Merchant', { exact: false }).fill('Campus shop');
  await page.getByLabel('Amount (₹)').fill('300');
  await page.getByLabel('Category').selectOption('SUPPLIES');
  await page.getByLabel('Purpose and details').fill('Markers and paper for our workshop');
  await page.getByLabel('Receipt proof').setInputFiles({
    name: 'receipt.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
      'base64',
    ),
  });
  await expect(page.getByText('Receipt attached')).toBeVisible();
  await page.getByRole('button', { name: 'Submit expense claim' }).click();
  await expect(page.getByRole('heading', { name: 'Workshop supplies' })).toBeVisible();
  const id = page.url().split('/').at(-1);
  await page.getByLabel('Demo account').selectOption('treasurer');
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('clubsphere-demo-v1')).session.userId === 'treasurer',
  );
  await page.goto(`/dashboard/skyline/expenses/${id}`);
  await page.getByRole('button', { name: 'Begin review' }).click();
  await page.getByRole('button', { name: 'Treasurer approval' }).click();
  await page.getByRole('button', { name: 'Record decision' }).click();
  await page.getByRole('button', { name: 'Record demo disbursement' }).click();
  await page.getByRole('button', { name: 'Record decision' }).click();
  await expect(page.locator('.badge').filter({ hasText: /^Disbursed$/ })).toBeVisible();
});
