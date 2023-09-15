import { test, expect, BrowserContext } from '@playwright/test';
import { urlConstructor } from './testUtils';
import exp from 'constants';

test('Unauthorized', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/error-403.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'posts', false, false, false, true)
  );

  expect(response?.status()).toBe(403);
});

test('Resource not found', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/error-404.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'post', true, true, false, true)
  );

  expect(response?.status()).toBe(404);
});

test('Validation fail', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/error-422.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'posts', true, true, true, true)
  );
  expect(response?.status()).toBe(422);
});
