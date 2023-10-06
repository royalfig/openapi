import path from 'path';
import {traverseFileSystem} from './traverse.js';
import {preprocess} from './preprocess.js';

const api = process.argv[2];
const root = process.cwd();

async function main(targetApi, basePath) {
    try {
        const targetPath = await preprocess(targetApi, basePath);

        // Begin processing
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
