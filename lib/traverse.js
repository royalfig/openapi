import fs from 'fs/promises';
import {merge} from 'lodash-es';
import path from 'path';
import {createExtractedSchema, generateNewSchema} from './preprocess.js';
import {processParams, rewriteNullableType, writeMetaSchema} from './process.js';
import {renderBaseSchema, securityMap, securitySchemesMap, serverMap, tagsMap} from './templates.js';

let pathsToAdd = {};

/**
 * Handle the reading and processing of a directory.
 * 
 * @param {string} dirPath - The path to the directory.
 * @param {string} api - The API identifier.
 * @param {number} depth - The directory depth.
 */
async function handleDirectory(dirPath, api, depth) {
    const dirContents = await fs.readdir(path.resolve(dirPath));
    const filteredContents = dirContents.filter(item => item !== '.DS_Store');

    for (const contents of filteredContents) {
        await traverseFileSystem(path.join(dirPath, contents), api, depth);
    }
}

async function writeSchema(extractedResource, resource, api) {
    if (!extractedResource) {
        return;
    }
    const propertiesWithoutNullable = rewriteNullableType(extractedResource.properties);
    extractedResource.properties = propertiesWithoutNullable;
        
    try {
        await fs.access(`../oas/${api}/components/schemas/${resource}.json`);
        const existingResource = await fs.readFile(`../oas/${api}/components/schemas/${resource}.json`, 'utf-8');
        const parsedExistingResource = JSON.parse(existingResource);
        const mergedResource = merge(parsedExistingResource, extractedResource);
        await fs.writeFile(`../oas/${api}/components/schemas/${resource}.json`, JSON.stringify(mergedResource, null, 4));
    } catch {
        await fs.writeFile(`../oas/${api}/components/schemas/${resource}.json`, JSON.stringify(extractedResource, null, 4));
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
            const {resource, method, spec, specKey, responseKey, description, operationId, extractedSchema} = await createExtractedSchema(fileOrFolder, tag);
            const extractedParms = spec.paths[specKey][method].parameters;
            console.log('🚀 ~ file: traverse.js:62 ~ traverseFileSystem ~ extractedParms:', extractedParms);

            // Because we're going to reference a common schema, we need to add it to the components
            if (extractedSchema) {
                const newSchema = generateNewSchema(resource, extractedSchema);
                spec.paths[specKey][method].responses[responseKey].content[
                    'application/json'
                ].schema = newSchema;

                await writeMetaSchema(extractedSchema, api);

                // Transform the resource
                //reference subschemas

                const extractedResource =
                extractedSchema.properties[resource]?.items ||
                extractedSchema.properties[resource];

                await writeSchema(extractedResource, resource, api);

                // Handle ID and slug
                if (/[a-z0-9]{24}/.test(specKey)) {
                    // processParams
                    const newParams = await processParams(spec.paths[specKey][method].parameters, 'id', api);
                    spec.paths[specKey][method].parameters = newParams; 
                    
                    // rewrite path
                    const newPath = specKey.replace(/[a-z0-9]{24}/, '{id}');
                    spec.paths[newPath] = spec.paths[specKey];
                    spec.paths[newPath][method].summary = description;
                    spec.paths[newPath][method].operationId = operationId;
                    delete spec.paths[specKey];

                    pathsToAdd[`/${resource}/{id}`] = {$ref: `./paths/${resource}-${method}-id.json`};
                    fs.writeFile(`../oas/${api}/paths/${resource}-${method}-id.json`, JSON.stringify(spec.paths[newPath], null, 4));
                } else if (/slug/.test(specKey)) {
                    // processParams
                    const newParams = await processParams(spec.paths[specKey][method].parameters, 'slug', api);
                    spec.paths[specKey][method].parameters = newParams;

                    //rewrite path
                    const newPath = specKey.replace(/slug\/.+/, '{slug}');
                    spec.paths[newPath] = spec.paths[specKey];
                    spec.paths[newPath][method].summary = description;
                    spec.paths[newPath][method].operationId = operationId;
                    delete spec.paths[specKey];

                    pathsToAdd[`/${resource}/slug/{slug}`] = {$ref: `./paths/${resource}-${method}-slug.json`};

                    fs.writeFile(`../oas/${api}/paths/${resource}-${method}-slug.json`, JSON.stringify(spec.paths[newPath], null, 4));
                } else {
                    const newParams = await processParams(spec.paths[specKey][method].parameters, null, api);
                    spec.paths[specKey][method].parameters = newParams;
                    spec.paths[specKey][method].summary = description;
                    spec.paths[specKey][method].operationId = operationId;

                    pathsToAdd[`/${resource}`] = {$ref: `./paths/${resource}-${method}.json`};
                    fs.writeFile(`../oas/${api}/paths/${resource}-${method}.json`, JSON.stringify(spec.paths[specKey], null, 4));
                }
            }
        }
    } catch (error) {
        console.error(error, fileOrFolder, api);
    } 

    if (depth === 0) {
        const baseOas = renderBaseSchema(api, 'Ghost\'s RESTful Content API delivers published content to the world and can be accessed in a read-only manner by any client to render in a website, app, or other embedded media.', './content-api.md', serverMap[api], securityMap[api], tagsMap[api], securitySchemesMap[api], pathsToAdd);
        await fs.writeFile(`../oas/${api}/openapi.json`, JSON.stringify(baseOas, null, 4));
    }
}

