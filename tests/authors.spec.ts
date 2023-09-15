import { test, expect, BrowserContext } from '@playwright/test';
import { urlConstructor } from './testUtils';

test('gets authors', async ({ page }) => {
  

  await page.routeFromHAR('./HAR/authors-browse.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'authors', true, true, false, true)
  );

  expect(response?.ok()).toBeTruthy();
});

test('gets authors by slug', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/authors-slug.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'authors/slug/jamie', true, true)
  );

  expect(response?.ok()).toBeTruthy();
});

test('gets authors by id', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/authors-id.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'authors/1', true, true)
  );

  expect(response?.ok()).toBeTruthy();
});
