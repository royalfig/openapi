import { test, expect, BrowserContext } from '@playwright/test';

test('gets tags', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({
    'Accept-Version': "v5.0"
  })
  await page.routeFromHAR('./HAR/tags200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/tags/?limit=1&key=22444f78447824223cefc48062'
  );
});

test('tags unauthorized', async ({ page }) => {
  await page.routeFromHAR('./HAR/tags400.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/tags/?limit=1&key=32444f78447824223cefc48062'
  );
});

test('gets tag by slug', async ({ page }) => {
  await page.routeFromHAR('./HAR/tagSlug200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/tags/slug/fables/?key=22444f78447824223cefc48062'
  );
});

test('gets tag by id', async ({ page }) => {
  await page.routeFromHAR('./HAR/tagsId200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/tags/5979a779df093500228e958a/?key=22444f78447824223cefc48062'
  );
});
