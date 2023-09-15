import { test, expect, BrowserContext } from '@playwright/test';
import { urlConstructor } from './testUtils';

test('gets settings', async ({ page }) => {
  
  await page.routeFromHAR('./HAR/settings-browse.har', {
    updateContent: 'embed',
    update: true,
  });

  const response = await page.goto(
    urlConstructor('content', 'settings', true, false)
  );
  expect(response?.ok()).toBeTruthy();
});
