import {traverseFileSystem} from './traverse.js';
import fs from 'fs/promises';

const api = process.argv[2];
// const api = 'content';

async function main(targetApi = 'admin') {
    try {
        if (!['content', 'admin', 'members', 'webmentions'].includes(targetApi)) {
            console.log('Please specify a valid API (content, admin, members, webmentions)');
            return;
        }

        const paths = {
            content: '../HAR/ghost/api/content',
            admin: '../HAR/ghost/api/admin',
            members: '../HAR/members/api',
            webmentions: '../HAR/webmentions'
        };

        const targetPath = paths[targetApi];

        try {
            await fs.rm(`../oas/${targetApi}`, {recursive: true});
        } catch (error) {
            console.log(error);
        }

        await fs.mkdir(`../oas/${targetApi}/components/schemas`, {recursive: true});
        await fs.mkdir(`../oas/${targetApi}/components/parameters`, {recursive: true});
        await fs.mkdir(`../oas/${targetApi}/paths`, {recursive: true});

        await traverseFileSystem(targetPath, targetApi);
    } catch (error) {
        console.log(error);
    }   
    // preprocess
    // process
    // postprocess
}

main(api);