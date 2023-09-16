import {test, expect, BrowserContext} from '@playwright/test';
import {urlConstructor} from './testUtils';

test('gets tags', async ({page}) => {
    await page.routeFromHAR('./HAR/tags-browse.har', {
        updateContent: 'embed',
        update: true
    });

    const response = await page.goto(
        urlConstructor('content', 'tags', true, true, false, true)
    );
    expect(response?.ok()).toBeTruthy();
});

test('gets tag by slug', async ({page}) => {
    await page.routeFromHAR('./HAR/tags-slug.har', {
        updateContent: 'embed',
        update: true
    });

    const response = await page.goto(
        urlConstructor('content', 'tags/slug/painting', true, true)
    );
    expect(response?.ok()).toBeTruthy();
});

test('gets tag by id', async ({page}) => {
    await page.routeFromHAR('./HAR/tags-id.har', {
        updateContent: 'embed',
        update: true
    });

    const response = await page.goto(
        urlConstructor('content', 'tags/65007f03b6f8200001927220', true, true)
    );
    expect(response?.ok()).toBeTruthy();
});
