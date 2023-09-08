import { test, expect, BrowserContext } from '@playwright/test';

test('gets posts', async ({ page }) => {
  await page.routeFromHAR('./HAR/posts200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/posts/?limit=1&key=22444f78447824223cefc48062'
  );
});

test('unauthorized', async ({ page }) => {
  await page.routeFromHAR('./HAR/posts400.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/posts/?limit=1&key=32444f78447824223cefc48062'
  );
});

test('gets post by slug', async ({ page }) => {
  await page.routeFromHAR('./HAR/postSlug200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/posts/slug/welcome/?key=22444f78447824223cefc48062'
  );
});

test('gets post by id', async ({ page }) => {
  await page.routeFromHAR('./HAR/postId200.har', {
    updateContent: "embed",
    update: true,
  });

  await page.goto(
    'https://demo.ghost.io/ghost/api/content/posts/605360bbce93e1003bd6ddd6/?key=22444f78447824223cefc48062'
  );
});
