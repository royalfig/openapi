import jsonSchema from '@tryghost/admin-api-schema';
import convert from '@openapi-contrib/json-schema-to-openapi-schema';


export async function matchOasToGhostSchema(rawSchema, resource, method) {
  const translationMap = new Map([
    ['posts', { jsonSchemaName: 'posts', jsonSchemaIdx: 0 }],
    ['authors', { jsonSchemaName: null, jsonSchemaIdx: null }],
    ['tags', { jsonSchemaName: 'tags', jsonSchemaIdx: 0 }],
    ['pages', { jsonSchemaName: 'pages', jsonSchemaIdx: 0 }],
    ['tiers', { jsonSchemaName: 'tiers', jsonSchemaIdx: 0 }],
    ['settings', { jsonSchemaName: null, jsonSchemaIdx: null }],
  ]);

  const { jsonSchemaName, jsonSchemaIdx } = translationMap.get(resource);

  if (!jsonSchemaName) {
    return rawSchema;
  }

  const fetchedJsonSchema = jsonSchema.get(jsonSchemaName);
  
  
  const clonedObj = { ...fetchedJsonSchema };
  
  const predef = clonedObj.definitions;
  clonedObj.properties = predef;
  delete clonedObj.definitions;

  const jsonSchemaToOpenApi = await convert(clonedObj);

  if (!jsonSchemaToOpenApi.properties) {
    console.log('aborted');
    return rawSchema;
  }
  const keyForAccess = Object.keys(jsonSchemaToOpenApi.properties)[
    jsonSchemaIdx
  ];
  const jsonSchemaProperties =
    jsonSchemaToOpenApi.properties[keyForAccess].properties;

  const propertyKeys = Object.keys(jsonSchemaProperties);

  for (let key of propertyKeys) {
    if (rawSchema?.properties[key]) {
      rawSchema.properties[key] = jsonSchemaProperties[key]; // TODO more handheld for nullable and type. winnow
    }
  }

  return rawSchema;
}

// export async function matchOasToGhostSchema(rawSchema, resource) {

//   const updatedResource = resource === 'pages' ? 'posts' : resource;

//   const schema = await getSchema();

//   const properties  = rawSchema.properties || rawSchema;

//   // Modify Ghost schema to match OAS responses
//   const metadata = schema.posts_meta;
//   // The schema separates the meta object from the posts object. Join them here.
//   schema.posts = { ...schema.posts, ...metadata };
//   // The next and prev properties won't be guessed correctly...
//   schema.meta = {
//     pagination: {
//       next: { type: 'integer', nullable: true },
//       prev: { type: 'integer', nullable: true },
//     },
//   };

//   // Get the top level keys in properties to match with the schema
//   const keys = Object.keys(properties);

//   for (let key of keys) {

//     delete properties[key].nullable;

//     const ghostSchema = schema?.[updatedResource]?.[key];

//     if (ghostSchema) {
//       if (ghostSchema.type === 'text') {
//         ghostSchema.type = 'string';
//       }

//       if (ghostSchema.type === 'dateTime') {
//         ghostSchema.type = 'string';
//         properties[key].format = 'date-time';
//       }

//       properties[key].type = !ghostSchema.nullable
//         ? ghostSchema.type
//         : [ghostSchema.type, 'null'];
//     }
//   }

//   return rawSchema;

// }
