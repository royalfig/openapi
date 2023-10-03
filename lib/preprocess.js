import {generateSpec} from 'har-to-openapi';
import fs from 'fs/promises';
import path from 'path';

/**
 * Parses a filename into a resource and method
 * @param {string} filename
 * @returns {object} Object containing resource (posts) and method (get, post, put, etc.)
 */
function parseFileName(file) {
    const [method, resource, ...args] = file.split('-');
    const nameArr = args.slice(2);
    const description = [nameArr[0].charAt(0).toUpperCase() + nameArr[0].slice(1), ...nameArr.slice(1)].join(' ');
    const operationId = nameArr.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    
    return {method: method.toLowerCase(), resource: resource.toLowerCase(), description, operationId};
}

/**
 * Extracts the schema from a HAR file
 * @param {string} file
 * @returns {object} Object containing resource, method, spec, specKey, and extractedSchema
 *
 */
export async function createExtractedSchema(file, tag, methodOverride) {
    const filename = path.basename(file, '.json');
    const {resource, method, description, operationId} = parseFileName(filename);

    console.log(
        'Processing data for \x1b[32m' +
      resource +
      '\x1b[0m (\x1b[92m' +
      method +
      '\x1b[0m) and generating OpenAPI spec...'
    );

    const harFile = await fs.readFile(file);
    const {spec} = await generateSpec(JSON.parse(harFile), {
        filterStandardHeaders: true,
        attemptToParameterizeUrl: true,
        tags: [tag]
    });

    const specKey = Object.keys(spec.paths)[0];
    const responseKey = Object.keys(spec.paths[specKey][method].responses)[0];

    const extractedSchema =
    spec.paths[specKey][method]?.responses[responseKey]?.content?.[
        'application/json'
    ].schema;

    if (!extractedSchema) {
        console.log('No extracted schema available! ', resource, method);
    }

    return {resource, method, operationId, description, spec, specKey, responseKey, extractedSchema};
}

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
