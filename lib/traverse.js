import fs from 'fs/promises';
import {merge} from 'lodash-es';
import path from 'path';
import {createExtractedSchema, writeJsonFile, readJsonFile} from './preprocess.js';
import {processExtractedSchema, processNullableType} from './process.js';
import {
    renderBaseSchema,
    securityMap,
    securitySchemesMap,
    serverMap,
    tagsMap
} from './templates.js';

let pathsToAdd = {};

/**
 * Handle the reading and processing of a directory.
 *
 * @param {string} dirPath - The path to the directory.
 * @param {string} api - The API identifier like content, admin
 * @param {number} depth - The directory depth, used for tracking recursion.
 */
async function handleDirectory(dirPath, api, depth) {
    const dirContents = await fs.readdir(path.resolve(dirPath));
    const filteredContents = dirContents.filter(item => item !== '.DS_Store');

    for (const contents of filteredContents) {
        await traverseFileSystem(path.join(dirPath, contents), api, depth);
    }
}

export async function writeSchema(extractedResource, resource, api) {
    if (!extractedResource) {
        return;
    }
    const propertiesWithoutNullable = processNullableType(
        extractedResource.properties
    );
    extractedResource.properties = propertiesWithoutNullable;

    try {
        await fs.access(path.resolve(process.cwd(), 'oas', api, 'components', 'schemas', resource, '.json'));
        
        const existingResource = await readJsonFile('oas', api, 'components', 'schemas', resource);
           
        const parsedExistingResource = JSON.parse(existingResource);
        const mergedResource = merge(parsedExistingResource, extractedResource);

        await writeJsonFile(mergedResource, 'oas', api, 'components', 'schemas', resource);
    } catch {
        await writeJsonFile(extractedResource, 'oas', api, 'components', 'schemas', resource);
    }
}

/**
 * Process the file or folder to extract and write schemas.
 *
 * @param {string} fileOrFolder - The path to the file or folder.
 * @param {string} api - The API identifier.
 * @param {number} [depth=0] - The directory depth.
 */
export async function traverseFileSystem(fileOrFolder, api, depth = 0) {
    try {
        const stat = await fs.stat(fileOrFolder);

        if (stat.isDirectory()) {
            await handleDirectory(fileOrFolder, api, depth + 1);
        } else {
            const directory = path.dirname(fileOrFolder);
            const tag = path.basename(directory);
            const {
                apiResource,
                httpMethod,
                spec,
                apiPath,
                httpResponseCode,
                description,
                operationId,
                extractedSchema
            } = await createExtractedSchema(fileOrFolder, tag);

            const {newPath, apiPathVariable} = await processExtractedSchema({
                extractedSchema,
                apiResource,
                spec,
                apiPath,
                httpMethod,
                httpResponseCode,
                api
            });

            // Add $ref to paths at the template level. The file is written once the recursion is complete.
            if (pathsToAdd[newPath]) {
                pathsToAdd[newPath] = {
                    ...pathsToAdd[newPath],
                    [httpMethod]: {
                        $ref: `./paths/${apiResource}-${httpMethod}${
                            apiPathVariable ? `-${apiPathVariable}` : ''
                        }.json`
                    }
                };
            } else {
                pathsToAdd[newPath] = {
                    [httpMethod]: {
                        $ref: `./paths/${apiResource}-${httpMethod}${
                            apiPathVariable ? `-${apiPathVariable}` : ''
                        }.json`
                    }
                };
            }
        }
    } catch (error) {
    // eslint-disable-next-line no-console
        console.error(error, fileOrFolder, api);
    }

    // Render and write top-level schema once recursion is complete.
    if (depth === 0) {
        const baseOas = renderBaseSchema(
            api,
            `Ghost's RESTful ${api} API delivers published content to the world and can be accessed in a read-only manner by any client to render in a website, app, or other embedded media.`,
            `./${api}-api.md`,
            serverMap[api],
            securityMap[api],
            tagsMap[api],
            securitySchemesMap[api],
            pathsToAdd
        );

        await writeJsonFile(baseOas, 'oas', api, 'openapi');
    }
}
