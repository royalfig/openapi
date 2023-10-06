import fs from 'fs/promises';
import path from 'path';
import {traverseFileSystem} from './traverse.js';

/**
 *
 * @param  {...any} paths - Omit CWD
 */

export async function writeDirectory(...paths) {
    try {
        await fs.mkdir(path.resolve(process.cwd(), ...paths), {
            recursive: true
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
}
/**
 *
 * @param {*} data
 * @param  {...any} paths - Omit CWD & file extension
 * @returns {Promise<void>}
 */

export async function writeJsonFile(data, ...paths) {
    const filename = paths.pop() + '.json';

    try {
        await fs.writeFile(path.resolve(process.cwd(), ...paths, filename), JSON.stringify(data, null, 4));
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
}

/**
 * @param {...any} paths - Omit CWD & file extension
 * @returns {Promise<Buffer>}
 */

export async function readJsonFile(...paths) {
    const filename = paths.pop() + '.json';

    try {
        return await fs.readFile(path.resolve(process.cwd(), ...paths, filename));
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
}

/**
 * Parses a filename into a resource and method
 * @param {string} filename
 * @returns {object} Object containing resource (posts) and method (get, post, put, etc.)
 */
export function parseFileName(file) {
    const [httpMethod, apiResource] = file.split('-');
    const isId = (/[a-z0-9]{24}/).test(file);
    const idSlug = (/slug/).test(file);
    const apiEndpointDescription = `${httpMethod.charAt(0)}${httpMethod.toLowerCase().slice(1)} ${apiResource} ${isId ? 'by ID' : ''}${idSlug ? 'by slug' : ''}`;
    const operationId = apiEndpointDescription.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');

    return {httpMethod: httpMethod.toLowerCase(), apiResource: apiResource.toLowerCase(), apiEndpointDescription, operationId};
}

/**
 * Handle the reading and processing of a directory.
 *
 * @param {string} dirPath - The path to the directory.
 * @param {string} api - The API identifier like content, admin
 * @param {number} depth - The directory depth, used for tracking recursion.
 */
export async function handleDirectory(dirPath, api, depth) {
    const dirContents = await fs.readdir(path.resolve(dirPath));
    const filteredContents = dirContents.filter(item => item !== '.DS_Store');

    for (const contents of filteredContents) {
        await traverseFileSystem(path.join(dirPath, contents), api, depth);
    }
}

