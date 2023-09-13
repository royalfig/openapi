import jsonSchema from '@tryghost/admin-api-schema';
import { additionalOasData } from './data.js';

export async function validateOasSchema(rawSchema, resource) {
  const { jsonSchemaName, jsonSchemaIdx } = additionalOasData.get(resource);

  if (!jsonSchemaName) {
    return rawSchema;
  }

  const fetchedJsonSchema = jsonSchema.get(jsonSchemaName);

  const clonedJsonSchema = { ...fetchedJsonSchema };

  if (!clonedJsonSchema.definitions) {
    return rawSchema;
  }

  const keyForAccess = Object.keys(clonedJsonSchema.definitions)[jsonSchemaIdx];

  const jsonSchemaProperties =
    clonedJsonSchema.definitions[keyForAccess].properties;

  const propertyKeys = Object.keys(jsonSchemaProperties);

  for (const key of propertyKeys) {
    if (rawSchema?.properties[key] && key !== 'authors' && key !== 'tags' && key !== 'tiers' && key !== 'collections') {
      // If our JSON schema has a property that matches the OAS schema, replace the JSON schema property.
      rawSchema.properties[key] = jsonSchemaProperties[key];
    }
  }
  return rawSchema;
}
