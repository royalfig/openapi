import { test, expect, BrowserContext } from '@playwright/test';
import { urlConstructor } from './testUtils';

test('Unauthorized', async ({ page }) => {
  await page.routeFromHAR('./HAR/error-403.har', {
    updateContent: 'embed',
    update: true,
  });

  await page.goto(urlConstructor('content', 'posts', false, false, false, true));
});

test('Resource not found', async ({ page }) => {
    await page.routeFromHAR('./HAR/error-404.har', {
      updateContent: 'embed',
      update: true,
    });
  
    await page.goto(urlConstructor('content', 'post', true, true, false, true));
  });

test('Validation fail', async ({ page }) => {
    await page.routeFromHAR('./HAR/error-422.har', {
      updateContent: 'embed',
      update: true,
    });

    await page.goto(urlConstructor('content', 'posts', true, true, true, true));
  });