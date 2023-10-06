import fs from 'fs/promises';
import path from 'path';
import {writeDirectory} from './preprocess.js';
import {traverseFileSystem} from './traverse.js';

const api = process.argv[2];
const root = process.cwd();

async function main(targetApi, basePath) {
    try {
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

        const targetPath = paths[targetApi];
        await traverseFileSystem(targetPath, targetApi);
        
        // eslint-disable-next-line no-console
        console.log(
            `\x1b[1m\n\nDone ✅\x1b[0m\n` +
        `──────────────────────────────────────────────────────\n` +
        `OpenAPI spec available at \x1b[36m${path.resolve(
            basePath,
            'oas',
            targetApi,
            'openapi.json'
        )}\x1b[0m\n` +
        `──────────────────────────────────────────────────────\n\n`
        );
    } catch (error) {
    // eslint-disable-next-line no-console
        console.log(error);
    }
}

main(api, root);
