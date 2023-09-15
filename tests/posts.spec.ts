import { test, expect, BrowserContext } from '@playwright/test';
import { urlConstructor } from './testUtils';

test('gets posts', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/posts-browse.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'posts', true, true, false, true)
  );
  expect(response?.ok()).toBeTruthy();
});

test('gets post by slug', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/posts-slug.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'posts/slug/lock', true, true)
  );
  expect(response?.ok()).toBeTruthy();
});

test('gets post by id', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/posts-id.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'posts/65007dbeb6f82000019271fa', true, true)
  );
  expect(response?.ok()).toBeTruthy();
});
