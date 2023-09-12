import { getSchema } from './getSchema.js';

export async function matchOasToGhostSchema(rawSchema, resource) {
  
  const updatedResource = resource === 'pages' ? 'posts' : resource;

  const schema = await getSchema();
  
  const properties  = rawSchema.properties || rawSchema;


  
  // Modify Ghost schema to match OAS responses
  const metadata = schema.posts_meta;
  // The schema separates the meta object from the posts object. Join them here.
  schema.posts = { ...schema.posts, ...metadata };
  // The next and prev properties won't be guessed correctly...
  schema.meta = {
    pagination: {
      next: { type: 'integer', nullable: true },
      prev: { type: 'integer', nullable: true },
    },
  };

  // Get the top level keys in properties to match with the schema
  const keys = Object.keys(properties);
  
  for (let key of keys) {

    delete properties[key].nullable;

    const ghostSchema = schema?.[updatedResource]?.[key];
    
    if (ghostSchema) {
      if (ghostSchema.type === 'text') {
        ghostSchema.type = 'string';
      }

      if (ghostSchema.type === 'dateTime') {
        ghostSchema.type = 'string';
        properties[key].format = 'date-time';
      }

      properties[key].type = !ghostSchema.nullable
        ? ghostSchema.type
        : [ghostSchema.type, 'null'];
    }
  }

  return rawSchema;
  
}
