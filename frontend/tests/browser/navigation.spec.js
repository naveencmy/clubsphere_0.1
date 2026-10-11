import { test, expect } from '@playwright/test';
import { createBrowserAuditSeed } from './helpers.js';
import fs from 'node:fs';
test.use({ trace: 'off' });
test('complete route inventory renders without broken navigation', async ({ page }) => {
  test.setTimeout(180000);
  const groups = {
    visitor: [
      '/',
      '/clubs',
      '/clubs/skyline',
      '/clubs/makers',
      '/events',
      '/events/gala',
      '/membership',
      '/store',
      '/store/hoodie',
      '/cart',
      '/announcements',
      '/login',
      '/register',
      '/demo',
      '/unauthorized',
      '/support/loading',
      '/support/empty',
      '/support/error',
      '/missing',
    ],
    member: [
      '/portal/dashboard',
      '/portal/profile',
      '/portal/membership',
      '/portal/pass',
      '/portal/renew',
      '/portal/tickets',
      '/portal/tickets/TCK-1001',
      '/portal/orders',
      '/portal/orders/ORD-1001',
      '/portal/announcements',
      '/portal/notifications',
      '/portal/search',
      '/checkout/order/ORD-AUDIT',
    ],
    volunteer: [
      '/portal/dashboard',
      '/portal/tasks',
      '/portal/fundraisers',
      '/portal/shifts',
      '/portal/expenses',
      '/portal/expenses/new',
      '/portal/expenses/EXP-1001',
      '/scanner/gala',
    ],
    president: [
      '/dashboard/skyline',
      '/dashboard/skyline/members',
      '/dashboard/skyline/members/MEM-1001',
      '/dashboard/skyline/events',
      '/dashboard/skyline/events/new',
      '/dashboard/skyline/events/gala/edit',
      '/dashboard/skyline/bookings',
      '/dashboard/skyline/attendees',
      '/dashboard/skyline/event-reports',
      '/dashboard/skyline/products',
      '/dashboard/skyline/inventory',
      '/dashboard/skyline/orders',
      '/dashboard/skyline/orders/ORD-1001',
      '/dashboard/skyline/returns',
      '/dashboard/skyline/tasks',
      '/dashboard/skyline/fundraisers',
      '/dashboard/skyline/shifts',
      '/dashboard/skyline/announcements',
      '/dashboard/skyline/broadcasts',
      '/dashboard/skyline/deliveries',
      '/dashboard/skyline/expenses',
      '/dashboard/skyline/approvals',
      '/dashboard/skyline/finance',
      '/dashboard/skyline/ledger',
      '/dashboard/skyline/budgets',
      '/dashboard/skyline/reports',
      '/dashboard/skyline/settings',
      '/dashboard/skyline/roles',
      '/dashboard/skyline/plans',
      '/dashboard/skyline/audit',
    ],
    auditor: [
      '/portal/dashboard',
      '/dashboard/skyline/ledger',
      '/dashboard/skyline/reports',
      '/dashboard/skyline/audit',
    ],
  };
  const errors = [],
    results = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [role, urls] of Object.entries(groups))
    for (const url of urls) {
      await page.goto('/');
      await page.evaluate(
        (s) => localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s)),
        createBrowserAuditSeed(role),
      );
      await page.goto(url);
      await page.locator('h1,h2').first().waitFor();
      await expect(page.getByText('We couldn’t render this view.')).toHaveCount(0);
      if (url !== '/missing' && url !== '/unauthorized' && !url.startsWith('/support/'))
        await expect(
          page.getByRole('heading', { name: 'Page not found', exact: true }),
        ).toHaveCount(0);
      if (!['/missing', '/unauthorized'].includes(url))
        await expect(
          page.getByRole('heading', { name: 'This space needs a different role.' }),
        ).toHaveCount(0);
      results.push({ role, url, result: 'PASS' });
    }
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync('artifacts/route-audit.json', JSON.stringify({ results, errors }, null, 2));
  expect(errors).toEqual([]);
});
test('documented responsive breakpoints and actual shared token treatments', async ({ page }) => {
  const results = [];
  await page.addInitScript(
    (s) => localStorage.setItem('clubsphere-demo-v1', JSON.stringify(s)),
    createBrowserAuditSeed('member'),
  );
  for (const width of [320, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/portal/dashboard');
    await page.waitForLoadState('networkidle');
    const values = await page.evaluate(() => {
      const card = document.querySelector('.card'),
        button = document.querySelector('.btn.primary'),
        h1 = document.querySelector('h1'),
        c = getComputedStyle(card),
        b = getComputedStyle(button),
        h = getComputedStyle(h1);
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        background: getComputedStyle(document.body).backgroundColor,
        surface: c.backgroundColor,
        radius: c.borderRadius,
        shadow: c.boxShadow,
        primary: b.backgroundColor,
        font: h.fontFamily,
        heading: h.fontSize,
        focusWidth: getComputedStyle(document.querySelector('.mobile-menu')).minWidth,
      };
    });
    expect(values.overflow).toBe(false);
    expect(values.background).toBe('rgb(248, 249, 250)');
    expect(values.surface).toBe('rgb(255, 255, 255)');
    expect(values.radius).toBe('12px');
    expect(values.primary).toBe('rgb(26, 115, 232)');
    expect(values.heading).toBe('28px');
    expect(values.font).toContain('Inter');
    await page.screenshot({
      path: `artifacts/screenshots/breakpoint-${width}.png`,
      fullPage: true,
    });
    results.push({ width, ...values });
  }
  fs.writeFileSync('artifacts/breakpoint-audit.json', JSON.stringify(results, null, 2));
});
