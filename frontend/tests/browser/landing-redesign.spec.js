import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { createSeed } from '../../src/mock/data/seed.js';

import { store } from '../../src/mock/mockStore.js';

test.use({ trace: 'off' });

test.beforeEach(async ({ page }) => {
  const seed = createSeed();
  seed.session.userId = 'visitor';
  await page.addInitScript(
    ({ key, seed }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seed));
    },
    { key: store.key, seed },
  );
});

test('minimal landing renders accessibly at mobile, tablet and desktop widths', async ({
  page,
}) => {
  test.setTimeout(120000);
  fs.mkdirSync('artifacts/screenshots', { recursive: true });
  const results = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [320, 390, 768, 1440, 1900]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'A simpler way to belong.' })).toBeVisible();
    await expect(page.locator('.demo-strip')).toHaveCount(0);
    await expect(
      page.locator('.landing-actions').getByRole('link', { name: 'Get started' }),
    ).toHaveAttribute('href', '/register');
    await expect(page.getByRole('link', { name: 'Explore events', exact: true })).toHaveCount(0);
    await expect(
      page.locator('.landing-invitation').getByRole('link', { name: 'Get started' }),
    ).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    if (width < 768) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Public navigation' })).toBeVisible();
      await page.getByRole('button', { name: 'Close menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Public navigation' })).toBeHidden();
    }
    const geometry = await page.evaluate(() => ({
      pageGutter: document.querySelector('.landing').getBoundingClientRect().left,
      contentWidth: document.querySelector('.landing').getBoundingClientRect().width,
      introWidth: document.querySelector('.landing-intro').getBoundingClientRect().width,
      leadWidth: document.querySelector('.landing-lead').getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      smallTargets: [...document.querySelectorAll('a,button')]
        .filter(
          (element) =>
            element.getBoundingClientRect().width > 0 && !element.classList.contains('skip-link'),
        )
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.width < 48 || bounds.height < 48;
        })
        .map((element) => element.textContent.trim() || element.getAttribute('aria-label')),
    }));
    expect(geometry.overflow).toBe(false);
    expect(geometry.pageGutter).toBe(width < 768 ? 16 : 32);
    expect(geometry.contentWidth).toBe(width - (width < 768 ? 32 : 64));
    expect(geometry.leadWidth).toBeCloseTo(geometry.introWidth, 0);
    if (width < 768) expect(geometry.smallTargets).toEqual([]);
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({
      path: `artifacts/screenshots/landing-${width === 1440 ? 'desktop' : width === 390 ? 'mobile' : width}.png`,
      fullPage: true,
    });
    if (width === 1440 || width === 390)
      await page.screenshot({ path: `artifacts/screenshots/landing-hero-${width}.png` });
    results.push({
      width,
      ...geometry,
      violations: accessibility.violations,
      runtimeErrors: [...errors],
    });
  }
  expect(errors).toEqual([]);
  fs.writeFileSync('artifacts/landing-redesign-audit.json', JSON.stringify(results, null, 2));
});

test('hero slideshow advances, pauses, selects events and keeps event destinations', async ({
  page,
}) => {
  await page.goto('/');
  const seed = createSeed();
  const events = seed.events.filter((event) => event.clubId === seed.session.clubId).slice(0, 3);
  const carousel = page.getByRole('region', { name: 'Featured campus events' });
  await expect(carousel.getByRole('heading', { name: events[0].title })).toBeVisible();
  await expect(carousel.getByRole('heading', { name: events[1].title })).toBeVisible({
    timeout: 7000,
  });
  await carousel.getByRole('button', { name: 'Pause event slideshow' }).click();
  await carousel.getByRole('button', { name: 'Next event', exact: true }).click();
  await expect(carousel.getByRole('heading', { name: events[2].title })).toBeVisible();
  await carousel.getByRole('button', { name: 'Previous event' }).click();
  await expect(carousel.getByRole('heading', { name: events[1].title })).toBeVisible();
  await carousel
    .getByRole('button', { name: `Show event 1: ${events[0].title}`, exact: true })
    .click();
  await expect(carousel.getByRole('link', { name: 'View event' })).toHaveAttribute(
    'href',
    `/events/${events[0].id}`,
  );
  await page.mouse.move(0, 0);
  await page.locator('#landing-title').click();
  await page.waitForTimeout(5200);
  await expect(carousel.getByRole('heading', { name: events[0].title })).toBeVisible();
  await carousel.getByRole('link', { name: 'View event' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/${events[0].id}$`));
});

test('reduced motion stops slideshow animation and automatic rotation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Featured campus events' });
  const title = await carousel.getByRole('heading').textContent();
  expect(
    await carousel
      .locator('.landing-slide')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  await expect(carousel.getByRole('button', { name: 'Pause event slideshow' })).toHaveCount(0);
  await page.waitForTimeout(5200);
  await expect(carousel.getByRole('heading')).toHaveText(title);
  await carousel.getByRole('button', { name: 'Next event', exact: true }).click();
  await expect(carousel.getByRole('heading')).not.toHaveText(title);
});
