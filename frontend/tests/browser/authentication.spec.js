import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from '../../../backend/node_modules/pg/lib/index.js';
import { config } from '../../../backend/src/config/env.js';
import { createAuthTestAccount } from '../../src/mock/fixtures/authTestAccount.js';

const accounts = [];
test.afterAll(async () => {
  const client = new pg.Client({ connectionString: config.DATABASE_URL });
  await client.connect();
  try {
    await client.query('DELETE FROM users WHERE email = ANY($1::citext[])', [
      accounts.map((account) => account.email),
    ]);
  } finally {
    await client.end();
  }
});

test('real email signup, persisted session, logout, wrong password and login', async ({ page }) => {
  const account = createAuthTestAccount(randomUUID());
  accounts.push(account);
  await page.goto('/register');
  await page.getByLabel('Full name').fill(account.name);
  await page.getByLabel('Email address').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/\/membership$/);
  await page.goto('/portal/dashboard');
  await expect(
    page.getByRole('link', { name: 'Authentication Test', exact: false }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/portal\/dashboard$/);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/portal/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email address').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/Invalid email or password/i);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/portal\/dashboard$/);
  expect(
    await page.evaluate(() =>
      Object.values(localStorage).some(
        (value) => value.includes('Auth-') && value.includes('-Pass!'),
      ),
    ),
  ).toBe(false);
});

test('login and signup render accessibly without demo controls or a footer', async ({ page }) => {
  fs.mkdirSync('artifacts/screenshots', { recursive: true });
  const evidence = [];
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const route of ['/login', '/register']) {
      await page.goto(route);
      await expect(page.getByLabel('Email address')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
      await expect(page.locator('footer,.demo-strip,#login-account')).toHaveCount(0);
      await page.getByLabel('Password', { exact: true }).fill('Visibility-check');
      await page.getByRole('button', { name: 'Show password' }).click();
      await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
      await page.getByRole('button', { name: 'Hide password' }).click();
      await page.getByLabel('Password', { exact: true }).fill('');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect(overflow).toBe(false);
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(axe.violations).toEqual([]);
      await page.screenshot({
        path: `artifacts/screenshots/${route.slice(1)}-${width}.png`,
        fullPage: true,
      });
      evidence.push({ route, width, overflow, violations: axe.violations });
    }
  }
  fs.writeFileSync('artifacts/authentication-audit.json', JSON.stringify(evidence, null, 2));
});

test('Google is connected to Better Auth and reports missing provider configuration honestly', async ({
  page,
}) => {
  await page.goto('/login');
  const request = page.waitForRequest((request) =>
    request.url().endsWith('/api/auth/session/sign-in/social'),
  );
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  expect((await request).postDataJSON().provider).toBe('google');
  await expect(page.getByRole('alert')).toContainText('Please use your email and password');
  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
});
