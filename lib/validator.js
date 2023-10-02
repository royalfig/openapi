import jsonSchemaTool from '@tryghost/admin-api-schema';
import {additionalOasData} from './data.js';
import {settingsSchema, authorsSchema} from './data.js';

function addRefToSchema(key, rawSchema) {
    rawSchema.properties[key] = {
        items: {
            $ref: `./${key}.json`
        },
        type: 'array'
    };

    if (['authors', 'tags'].includes(key)) {
        rawSchema.properties[`primary_${key.slice(0, -1)}`] = {
            $ref: `./${key}.json`
        };
    }
}
export async function validateOasSchema(rawSchema, resource) {
    const {jsonSchemaName, jsonSchemaIdx} = additionalOasData.get(resource);

    let jsonSchema;

    if (resource === 'settings') {
        jsonSchema = settingsSchema;
    } else if (resource === 'authors') {
        jsonSchema = authorsSchema;
    } else {
        jsonSchema = {...jsonSchemaTool.get(jsonSchemaName)};
    }

    if (!jsonSchema.definitions) {
    // Throw error here..?
        console.log(`No definitions for ${jsonSchema}`);
        return rawSchema;
    }

    const keyForAccess = Object.keys(jsonSchema.definitions)[jsonSchemaIdx];

    const jsonSchemaProperties = jsonSchema.definitions[keyForAccess].properties;

    const propertyKeys = Object.keys(jsonSchemaProperties);

    for (const key of propertyKeys) {
        if (key === 'collections') {
            continue;
        }

        if (['authors', 'tags', 'tiers'].includes(key)) {
            addRefToSchema(key, rawSchema);
            continue;
        }

        if (rawSchema?.properties[key]) {
            rawSchema.properties[key] = jsonSchemaProperties[key];
        }
    }

    return rawSchema;
}
