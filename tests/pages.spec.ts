import { test, expect, BrowserContext } from '@playwright/test';

test('gets pages', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({
    'Accept-Version': "v5.0"
  })
  await page.routeFromHAR('./HAR/pages200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/pages/?limit=1&key=22444f78447824223cefc48062'
  );
});

test('pages unauthorized', async ({ page }) => {
  await page.routeFromHAR('./HAR/pages400.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/pages/?limit=1&key=32444f78447824223cefc48062'
  );
});

test('gets page by slug', async ({ page }) => {
  await page.routeFromHAR('./HAR/pageSlug200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/pages/slug/about/?key=22444f78447824223cefc48062'
  );
});

test('gets page by id', async ({ page }) => {
  await page.routeFromHAR('./HAR/pageId200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/pages/62416b8cfb349a003cafc2f1/?key=22444f78447824223cefc48062'
  );
});
