import {generateSpec} from 'har-to-openapi';
import fs from 'fs/promises';
import path from 'path';

/**
 * Parses a filename into a resource and method
 * @param {string} filename
 * @returns {object} Object containing resource (posts) and method (get, post, put, etc.)
 */
function parseFileName(file) {
    const [httpMethod, apiResource, ...args] = file.split('-');
    const nameArr = args.slice(2);
    const apiEndpointDescription = [nameArr[0].charAt(0).toUpperCase() + nameArr[0].slice(1), ...nameArr.slice(1)].join(' ');
    const operationId = nameArr.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    
    return {httpMethod: httpMethod.toLowerCase(), apiResource: apiResource.toLowerCase(), apiEndpointDescription, operationId};
}

/**
 * Extracts the schema from a HAR file
 * @param {string} file - The path to the HAR file
 * @param {string} tag - The tag to add to the OpenAPI spec
 * @returns {object} Object containing the resource, method, and extracted schema
 *
 */
export async function createExtractedSchema(file, tag) {
    const filename = path.basename(file, '.json');
    const {apiResource, httpMethod, apiEndpointDescription, operationId} = parseFileName(filename);

    // eslint-disable-next-line no-console
    console.log(
        'Processing data for \x1b[32m' +
      apiResource +
      '\x1b[0m (\x1b[92m' +
      httpMethod +
      '\x1b[0m) and generating OpenAPI spec...'
    );

    const harFile = await fs.readFile(file);
    const {spec} = await generateSpec(JSON.parse(harFile), {
        filterStandardHeaders: true,
        attemptToParameterizeUrl: true,
        tags: [tag]
    });

    const apiPath = Object.keys(spec.paths)[0];
    const httpResponseCode = Object.keys(spec.paths[apiPath][httpMethod].responses)[0];

    const extractedSchema =
    spec.paths[apiPath][httpMethod]?.responses[httpResponseCode]?.content?.[
        'application/json'
    ].schema;

    if (!extractedSchema) {
        // eslint-disable-next-line no-console
        console.log(`\x1b[31m\x1b[1m❗${apiResource} ${httpMethod} \x1b[0mdoes not have a schema!`);
    }

    return {apiResource, httpMethod, operationId, apiEndpointDescription, spec, apiPath, httpResponseCode, extractedSchema};
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

/**
 * 
 * @param  {...any} paths - Omit CWD
 */
export async function writeDirectory(...paths) {
    try {
        await fs.mkdir(path.resolve(process.cwd(),...paths), {
            recursive: true
        });
    } catch (error){
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
export async function writeJsonFile(data,...paths) {
    const filename = paths.pop() + '.json';
  
    try {
        await fs.writeFile(path.resolve(process.cwd(),...paths, filename), JSON.stringify(data, null, 4));
    } catch (error){
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
        return await fs.readFile(path.resolve(process.cwd(),...paths, filename));
    } catch (error){
        // eslint-disable-next-line no-console
        console.log(error);
    }
}