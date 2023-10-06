import fs from 'fs/promises';
import path from 'path';
import {processExtractedSchema} from './process.js';
import {createExtractedSchema} from './schema-tools.js';
import {
    renderBaseSchema,
    securityMap,
    securitySchemesMap,
    serverMap,
    tagsMap
} from './templates.js';
import {handleDirectory, writeJsonFile} from './utils.js';

let pathsToAdd = {};

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
                apiEndpointDescription,
                operationId,
                extractedSchema
            } = createExtractedSchema(fileOrFolder, tag);

            const {newPath, apiPathVariable} = await processExtractedSchema({
                extractedSchema,
                apiResource,
                spec,
                apiPath,
                httpMethod,
                httpResponseCode,
                api,
                apiEndpointDescription,
                operationId
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
