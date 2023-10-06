import fs from 'fs/promises';
import {generateSpec} from 'har-to-openapi';
import {merge} from 'lodash-es';
import path from 'path';
import {processNullableType} from './process.js';
import {parseFileName, readJsonFile, writeJsonFile} from './utils.js';

/**
 * Extracts the schema from a HAR file
 * @param {string} file - The path to the HAR file
 * @param {string} tag - The tag to add to the OpenAPI spec
 * @returns {Promse<{apiResource, httpMethod, operationId, apiEndpointDescription, spec, apiPath, httpResponseCode, extractedSchema}>} - 
 *
 */
export async function createExtractedSchema(file, tag) {
    const filename = path.basename(file, '.json');

    const harFile = await fs.readFile(file);
    const {spec} = await generateSpec(JSON.parse(harFile), {
        filterStandardHeaders: true,
        attemptToParameterizeUrl: true,
        tags: [tag]
    });

    const apiPath = Object.keys(spec.paths)[0];
    const {apiResource, httpMethod, apiEndpointDescription, operationId} = parseFileName(filename, apiPath);
    const httpResponseCode = Object.keys(spec.paths[apiPath][httpMethod].responses)[0];

    const extractedSchema =
    spec.paths[apiPath][httpMethod]?.responses[httpResponseCode]?.content?.[
        'application/json'
    ].schema;

    if (!extractedSchema) {
        // eslint-disable-next-line no-console
        console.log(`\x1b[31m\x1b[1m❗${apiResource} ${httpMethod} \x1b[0mdoes not have a schema!`);
    }

    // eslint-disable-next-line no-console
    console.log(
        'Processing data for \x1b[32m' +
      apiResource +
      '\x1b[0m (\x1b[92m' +
      httpMethod +
      '\x1b[0m) and generating OpenAPI spec...'
    );

    return {apiResource, httpMethod, operationId, apiEndpointDescription, spec, apiPath, httpResponseCode, extractedSchema};
}

/**
 * Generates a new schema for a resource
 * @param {string} resource - The resource name (e.g. posts)
 * @param {object} extractedSchema - The extracted schema from the HAR file
 * @returns {object} The new schema
 */
export function generateNewSchema(resource, extractedSchema) {
    const baseSchema = {
        type: 'object',
        properties: {
            [resource]: {
                type: 'array',
                items: {
                    $ref: `../components/schemas/${resource}.json`
                }
            }
        }
    };

    if (extractedSchema.properties.meta) {
        baseSchema.properties.meta = {
            $ref: '../components/schemas/meta.json'
        };
    }

    return baseSchema;
}

/**
 * Processes the extracted schema and writes the meta schema
 * @param {object} extractedSchema - The extracted schema from the HAR file
 * @param {string} api - The API identifier
 */
export async function writeSchema(extractedResource, resource, api, httpResponseCode) {
    if (!extractedResource) {
        return;
    }
    
    const propertiesWithoutNullable = processNullableType(
        extractedResource.properties
    );
    extractedResource.properties = propertiesWithoutNullable;

    let newResourceName = httpResponseCode.startsWith('4') ? `${httpResponseCode}-error` : resource;

    try {
        await fs.access(path.resolve(process.cwd(), 'oas', api, 'components', 'schemas', newResourceName, '.json'));

        const existingResource = await readJsonFile('oas', api, 'components', 'schemas', newResourceName);

        const parsedExistingResource = JSON.parse(existingResource);
        const mergedResource = merge(parsedExistingResource, extractedResource);

        await writeJsonFile(mergedResource, 'oas', api, 'components', 'schemas', newResourceName);
    } catch {
        await writeJsonFile(extractedResource, 'oas', api, 'components', 'schemas', newResourceName);
    }
}

