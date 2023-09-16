import {test, expect, BrowserContext} from '@playwright/test';
import {urlConstructor} from './testUtils';

test('gets tiers', async ({page}) => {
    await page.routeFromHAR('./HAR/tiers-browse.har', {
        updateContent: 'embed',
        update: true
    });

    const response = await page.goto(
        urlConstructor('content', 'tiers', true, true, false, true)
    );

    expect(response?.ok()).toBeTruthy();
});
