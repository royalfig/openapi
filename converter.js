import { generateSpec } from 'har-to-openapi';
import fs from 'fs/promises';
import { parse } from 'path';

const template = await fs.readFile('./OasStarterTemplate.json', 'utf8');

async function getSchema() {
  // Check if file already exists
  try {
    await fs.readFile('./schema.cjs');
    const schema = await import('./schema.cjs');
    return schema.default;
  } catch (error) {
    console.log('Schema file does not exist, fetching from GitHub');
  }

  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/TryGhost/Ghost/main/ghost/core/core/server/data/schema/schema.js'
    );
    const text = await res.text();
    await fs.writeFile('./schema.cjs', text);

    const schema = await import('./schema.cjs');
    return schema.default;
  } catch (error) {
    throw new Error(`Error fetching schema: ${error}`);
  }
}

const schema = await getSchema();

// Read in all files with .har extension
async function readFiles(dirname, ext) {
  // Check if directory exists
  try {
    await fs.access(dirname);
  } catch (error) {
    throw new Error(`Directory ${dirname} does not exist`);
  }

  const files = await fs.readdir(dirname);
  const filteredFiles = files.filter((file) => file.endsWith(ext));
  return filteredFiles.map((file) => `${dirname}/${file}`);
}

async function combineFileContents(files) {
  const mainFile = await fs.readFile(files[0], 'utf8');
  let mainFileJSON = JSON.parse(mainFile);

  for (let i = 1; i < files.length; i++) {
    const file = await fs.readFile(files[i], 'utf8');
    const fileJSON = JSON.parse(file);

    mainFileJSON.log.entries.push(fileJSON?.log?.entries[0]);
  }

  return mainFileJSON;
}

const postHarFiles = await readFiles('./HAR/', '.har');
const combinedPostHarFile = await combineFileContents(postHarFiles);

console.log(combinedPostHarFile);

const openapi = await generateSpec(combinedPostHarFile, {
  filterStandardHeaders: true,
  attemptToParameterizeUrl: true,
  tags: ['posts', 'authors', 'tags', 'pages'],
});
const { spec, yamlSpec } = openapi;

function modifySpec(spec, schema, template) {
  const parsedTemplate = JSON.parse(template);

  const metadata = schema.posts_meta;
  schema.posts = { ...schema.posts, ...metadata };
  schema.meta = {
    pagination: {
      pages: { type: 'integer', nullable: true },
      limit: { type: ['integer', 'string'] },
    },
  };

//   console.log(schema);

  // Access all paths in the spec
  const { paths } = spec;

  for (const path in paths) {
    const pathObject = paths[path];
    const { properties } =
      pathObject.get.responses[200].content['application/json'].schema;

    // Get the top level keys in properties to match with the schema
    const keys = Object.keys(properties);

    for (let key of keys) {
      const schemaKey = key === 'pages' ? 'posts' : key;

      // Update the oas schema to match Ghost's schema
      if (schema[schemaKey]) {
        

        const subPath = key === 'meta' ? properties[key].properties : properties[key].items.properties;
       

        for (const prop in subPath) {
         
          delete subPath[prop].nullable;

          const ghostSchema = schema[schemaKey]?.[prop];
          
          if (ghostSchema) {
            if (ghostSchema.type === 'text') {
              ghostSchema.type = 'string';
            }

            if (ghostSchema.type === 'dateTime') {
              ghostSchema.type = 'string';
              subPath[prop].format = 'date-time';
            }

            subPath[prop].type = !ghostSchema.nullable
              ? ghostSchema.type
              : [ghostSchema.type, 'null'];
          }
        }
      }
    }
  }

  parsedTemplate.paths = paths;

  return parsedTemplate;
}

const modifiedSpec = modifySpec(spec, schema, template);

await fs.mkdir('./generatedOAS/', { recursive: true });
await fs.writeFile(
  './generatedOAS/spec.json',
  JSON.stringify(modifiedSpec, null, 2)
);
