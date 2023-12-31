import fs from 'fs/promises';
import path from 'path';
import {authorsSchema, paramsData, tagSchema} from './data.js';
import {generateNewSchema} from './schema-tools.js';
import {writeJsonFile} from './utils.js';
import {writeSchema} from './schema-tools.js';
/**
 * Processes parameters for OAS
 * @param {array} params
 * @param {string} method
 */
export async function processParams(params, method, api) {
    if (!params) {
        return [];
    }

    // Remove key from params because it's included as security schema
    const keyIndex = params.findIndex(param => param.name === 'key');
    if (keyIndex !== -1) {
        params.splice(keyIndex, 1);
    }

    if (method === 'id' || method === 'slug') {
        params.push({
            description: `${method}`,
            in: 'path',
            name: `${method}`,
            required: true,
            schema: {
                type: 'string',
                example: '...'
            }
        });
    }

    let newParams = [];

    for (let param of params) {
        delete param.schema.default;
        if (paramsData[param.name]) {
            param.description = paramsData[param.name].description;
        }
        await writeJsonFile(param, 'oas', api, 'components', 'parameters', param.name);

        newParams.push({$ref: `../components/parameters/${param.name}.json`});
    }

    return newParams;
}

export async function processMetaSchema(extractedSchema, api) {
    if (!extractedSchema.properties?.meta || !extractedSchema.properties?.meta?.properties?.pagination) {
        return;
    }
    const {meta} = extractedSchema.properties;
    const propertiesWithoutNullable = processNullableType(meta.properties.pagination.properties);
    meta.properties.pagination.properties = propertiesWithoutNullable;
    meta.title = 'Meta';
    await writeJsonFile(meta, 'oas', api, 'components', 'schemas', 'meta');
}

export function processNullableType(properties) {
    if (!properties) {
        return properties;
    }
    
    for (const key of Object.keys(properties)) {
        if (properties[key].nullable) {
            properties[key] = {
                type: ['string','null']
            };
        }

        if (properties[key].anyOf) {
            const nullableIndex = properties[key].anyOf.findIndex(
                type => type.nullable
            );
            if (nullableIndex !== -1) {
                const otherIndex = nullableIndex === 0 ? 1 : 0;
                properties[key] = {type: [properties[key].anyOf[otherIndex].type, 'null']};
            }
        }
    }
    return properties;
}

function testIdOrSlug(apiPath) {
    if (/[a-z0-9]{24}/.test(apiPath)) {
        return 'id';
    }

    if (/slug/.test(apiPath)) {
        return 'slug';
    }

    return null;
}

async function processPath({
    api,
    apiResource,
    apiPath,
    spec,
    httpMethod,
    apiEndpointDescription,
    operationId,
    apiPathVariable,
    newParams
}) {
    let newPath = apiPath;

    if (apiPathVariable === 'id') {
        newPath = apiPath.replace(/[a-z0-9]{24}/, '{id}');
    }

    if (apiPathVariable === 'slug') {
        newPath = apiPath.replace(/slug\/.+/, '{slug}');
    }

    spec.paths[newPath] = spec.paths[apiPath];
    spec.paths[newPath][httpMethod].summary = apiEndpointDescription;
    spec.paths[newPath][httpMethod].operationId = operationId;
    spec.paths[newPath][httpMethod].parameters = newParams;
    spec.paths[newPath][httpMethod].responses[404] = {description: 'Not found'};
    spec.paths[newPath][httpMethod].responses[401] = {description: 'Not authorized'};

    if (apiPathVariable) {
        delete spec.paths[apiPath];
    }

    const pathFilename = `${apiResource}-${httpMethod}${apiPathVariable ? `-${apiPathVariable}` : ''}`;
    const filePath = path.resolve(process.cwd(), 'oas', api, 'paths', pathFilename);

    try {
        await fs.access(filePath);

        const existingPath = await fs.readFile(filePath, 'utf-8');
        const parsedExistingPath = JSON.parse(existingPath);
        const combinedParams = parsedExistingPath.parameters.concat(newParams);
        const uniqueParams = combinedParams.filter((item, idx, array) => {
            return (
                array.findIndex(otherItem => otherItem.$ref === item.$ref) === idx
            );
        });
        parsedExistingPath.parameters = uniqueParams;

        await writeJsonFile(parsedExistingPath, 'oas', api, 'paths', pathFilename);
    } catch {
        await writeJsonFile(spec.paths[newPath][httpMethod], 'oas', api, 'paths', pathFilename);
    }

    const suffix = apiPathVariable === 'id' ? '/{id}' : `/slug/{slug}`;

    return `/${apiResource}${apiPathVariable ? suffix : ''}`;
}

export async function processExtractedSchema({
    api,
    apiResource,
    httpMethod,
    spec,
    apiPath,
    httpResponseCode,
    apiEndpointDescription,
    operationId,
    extractedSchema
}) {
    const apiPathVariable = testIdOrSlug(apiPath);

    if (extractedSchema) {
        const newSchema = generateNewSchema(apiResource, extractedSchema);
        spec.paths[apiPath][httpMethod].responses[httpResponseCode].content[
            'application/json'
        ].schema = newSchema;

        await processMetaSchema(extractedSchema, api);

        const extractedResource =
        extractedSchema.properties[apiResource]?.items ||
        extractedSchema.properties[apiResource];

        if (extractedResource?.properties) {
            if (extractedResource.properties.authors) {
                extractedResource.properties.authors.items = {
                    $ref: './authors.json'
                };
                writeSchema(authorsSchema, 'authors', api, httpResponseCode);
            }

            if (extractedResource.properties.primary_author) {
                extractedResource.properties.primary_author = {
                    $ref: './authors.json'
                };
                writeSchema(authorsSchema, 'authors', api, httpResponseCode);
            }

            if (extractedResource.properties.tags) {
                extractedResource.properties.tags.items = {
                    $ref: './tags.json'
                };
                writeSchema(tagSchema, 'tags', api, httpResponseCode);
            }

            if (extractedResource.properties.primary_tag) {
                extractedResource.properties.primary_tag = {
                    $ref: './tags.json'
                };
                writeSchema(tagSchema, 'tags', api, httpResponseCode);
            }

            if (extractedResource.properties.tiers) {
                extractedResource.properties.tiers.items = {
                    $ref: './tiers.json'
                };
            }
        }

        await writeSchema(extractedResource, apiResource, api, httpResponseCode);
    }

    const newParams = await processParams(
        spec.paths?.[apiPath]?.[httpMethod]?.parameters,
        apiPathVariable,
        api
    );

    const newPath = await processPath({
        api,
        apiResource,
        apiPath,
        spec,
        httpMethod,
        apiEndpointDescription,
        operationId,
        apiPathVariable,
        newParams
    });

    return {newPath, apiPathVariable};
}
