import {paramsData} from './data.js';
import fs from 'fs/promises';
/**
 * Processes parameters for OAS
 * @param {array} params
 * @param {string} method
 */
export async function processParams(params, resource, api) {
    if (!params) {
        return;
    }
    
    // Remove key from params because it's already included elsewhere
    const keyIndex = params.findIndex(param => param.name === 'key');
    if (keyIndex !== -1) {
        params.splice(keyIndex, 1);
    }
    
    for (let param of params) {
        try {
            await fs.access(`../oas/${api}/components/parameters/${param.name}.json`);
            const existingResource = await fs.readFile(`../oas/${api}/components/schemas/${resource}.json`, 'utf-8');
            const parsedExistingResource = JSON.parse(existingResource);
            const mergedResource = merge(parsedExistingResource, extractedResource);
            await fs.writeFile(`../oas/${api}/components/schemas/${resource}.json`, JSON.stringify(mergedResource, null, 4));
        } catch {
            await fs.writeFile(`../oas/${api}/components/schemas/${resource}.json`, JSON.stringify(extractedResource, null, 4));
        }
        delete param.schema.default;
        if (paramsData[param.name]) {
            param.description = paramsData[param.name].description;
        }
        await fs.writeFile(`../oas/${api}/components/parameters/${param.name}.json`, JSON.stringify(param, null, 4));
        param = {$ref: `../components/parameters/${param.name}.json`};
    }

    return params;
}

export async function writeMetaSchema(extractedSchema, api) {
    if (!extractedSchema.properties?.meta) {
        return; 
    }
    const {meta} = extractedSchema.properties;
    const propertiesWithoutNullable = rewriteNullableType(meta.properties);
    meta.properties = propertiesWithoutNullable;
    delete meta.title;
    await fs.writeFile(`../oas/${api}/components/schemas/meta.json`, JSON.stringify(meta, null, 4));
}

export function rewriteNullableType(properties) {
    if (!properties) {
        return properties;
    }

    for (const key of Object.keys(properties)) {
        if (properties[key].nullable) {
            properties[key] = {
                type: 'string'
            };
        }

        if (properties[key].anyOf) {
            const nullableIndex = properties[key].anyOf.findIndex(type => type.nullable);
            if (nullableIndex !== -1) {
                const otherIndex = nullableIndex === 0 ? 1 : 0;
                properties[key] = properties[key].anyOf[otherIndex];
            }
        }
    }
    return properties;
}