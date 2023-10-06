import fs from 'fs/promises';
import path from 'path';
import {writeDirectory} from './utils.js';

export async function preprocess(targetApi, basePath) {
    if (!['content', 'admin', 'members', 'webmentions'].includes(targetApi)) {
        // eslint-disable-next-line no-console
        console.log(
            'Please specify a valid API (content, admin, members, webmentions)'
        );
        return;
    }

    const oasPath = path.resolve(basePath, 'oas');

    const paths = {
        content: path.resolve(basePath, 'HAR', 'ghost', 'api', 'content'),
        admin: path.resolve(basePath, 'HAR', 'ghost', 'api', 'admin'),
        members: path.resolve(basePath, 'HAR', 'members', 'api'),
        webmentions: path.resolve(basePath, 'HAR', 'webmentions')
    };

    // Remove existing OAS files
    try {
        await fs.rm(path.resolve(oasPath, targetApi), {recursive: true});
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }

    writeDirectory('oas', targetApi, 'components', 'schemas');
    writeDirectory('oas', targetApi, 'components', 'parameters');
    writeDirectory('oas', targetApi, 'paths');

    return paths[targetApi];
}