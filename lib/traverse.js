import fs from 'fs/promises';
import {generateSpec} from 'har-to-openapi';
import path from 'path';

/**
 * 
 * @param {string}} fileOrFolder 
 * @param {string} api 
 * @returns 
 */
export async function traverseFileSystem(fileOrFolder, api) {
    try {
        const pathContents = path.resolve(fileOrFolder);
        const stat = await fs.stat(pathContents);
 
        if (stat.isDirectory()) {
            await handleDirectory(fileOrFolder, pathContents, api);
        } else {
            const directory = path.dirname(pathContents);
            const isId = directory.includes('id');
            const isSlug = directory.includes('slug');
            const filename = path.basename(pathContents, '.json');
 
            if (isId) {
                writeOasFile(filename, pathContents, api, true);
                return;
            }
 
            if (isSlug) {
                writeOasFile(filename, pathContents, api, false, true);
 
                return;
            }
 
            writeOasFile(filename, pathContents, api);
        }
    } catch (error) {
        console.log(error);
    }
}

async function handleDirectory(fileOrFolder, pathContents, api) {
    const dir = await fs.readdir(path.resolve(fileOrFolder));

    // remove ds_store from array
    const dsStore = dir.indexOf('.DS_Store');

    if (dsStore > -1) {
        dir.splice(dsStore, 1);
    }

    for (const contents of dir) {
        await traverseFileSystem(path.join(pathContents, contents), api);
    }
}

async function writeOasFile(filename, pathContents, api, id = false, slug = false) {
    const {method, resource} = parseMethodAndResource(filename);
    const file = await fs.readFile(pathContents, 'utf-8');
    const {spec} = await generateSpec(JSON.parse(file));
    await fs.writeFile(
        `./test/${api}/${method}-${resource}${id ? '-id' : ''}${slug ? '-slug' : ''}.json`,
        JSON.stringify(spec));
}

function parseMethodAndResource(pathString) {
    const [method, resource] = pathString.split('-');
    return {method, resource};
}
