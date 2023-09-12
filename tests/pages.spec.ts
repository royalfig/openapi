import { test, expect, BrowserContext } from '@playwright/test';
import { urlConstructor } from './testUtils';

test('gets pages', async ({ page }) => {
  await page.routeFromHAR('./HAR/pages-browse.har', {
    updateContent: 'embed',
    update: true,
  });

 
  await page.goto(urlConstructor('content', 'pages', true, true, false, true));
});

test('gets page by slug', async ({ page }) => {
  await page.routeFromHAR('./HAR/pages-slug.har', {
    updateContent: 'embed',
    update: true,
  });


  await page.goto(urlConstructor('content', 'pages/slug/favorite-paintings', true, true));
});

test('gets page by id', async ({ page }) => {
  await page.routeFromHAR('./HAR/pages-id.har', {
    updateContent: 'embed',
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/pages/65007ce1b6f82000019271de/?key=22444f78447824223cefc48062'
  );
  
});
