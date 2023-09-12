import fs from 'fs/promises';
import { generateSpec } from 'har-to-openapi';
import { conversionOptions } from './generateOpenAPISpec.js';
import { matchOasToGhostSchema } from './matchOasToGhostSchema.js';
import { match } from 'assert';

const HAR_PATH = './HAR';
const OAS_DIR = './generatedSpec';
const SCHEMAS_DIR = `${OAS_DIR}/components/schemas`;
const PATHS_DIR = `${OAS_DIR}/paths`;

const template = await fs.readFile(`${OAS_DIR}/openapi-template.json`);
const parsedTemplate = JSON.parse(template);


async function getGeneratedHarFiles() {
  return await fs.readdir(HAR_PATH);
}

async function readHarFile(file) {
  return await fs.readFile(`${HAR_PATH}/${file}`, 'utf8');
}

function generateNewSchema(resource) {
  if (resource === 'settings') {
    return { $ref: `../components/schemas/${resource}.json` };
  }

  const baseSchema = {
    type: 'object',
    properties: {
      [resource]: {
        type: 'array',
        items: {
          $ref: `../components/schemas/${resource}.json`,
        },
      },
    },
  };

  if (resource !== 'settings') {
    baseSchema.properties.meta = {
      type: 'object',
      properties: {
        $ref: '../components/schemas/meta.json',
      },
    };
  }

  return baseSchema;
}

function buildUrl(resource,method) {
  
  let path = null;

  if (method === 'id') {
    return `/${resource}/{id}`;
  }

  if (method === 'slug') {
    return `/${resource}/slug/{slug}`;
  }

  return `/${resource}`
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function modifyHarFiles() {
  const generatedHarFiles = await getGeneratedHarFiles();
  const pathsToAdd = {};

  for (const file of generatedHarFiles) {
    const [resourceMethod] = file.split('.');
    const [resource, method] = resourceMethod.split('-');
    await fs.mkdir(PATHS_DIR, { recursive: true });

    const harFile = await readHarFile(file);
    const { spec } = await generateSpec(JSON.parse(harFile), conversionOptions);
    const specKey = Object.keys(spec.paths)[0];
    const extractedSchema = spec.paths[specKey].get.responses[200]?.content['application/json'].schema;

    if (extractedSchema) {
      spec.paths[specKey].get.responses[200].content['application/json'].schema = generateNewSchema(resource);
      const extractedResource = extractedSchema.properties[resource]?.items || extractedSchema.properties[resource];


      const validatedResource  = await matchOasToGhostSchema(extractedResource, resource, method);
      console.log("🚀 ~ file: converter.js:92 ~ modifyHarFiles ~ validatedResource:", validatedResource)
      
      // parsedTemplate.components.schemas.meta = meta;
      // parsedTemplate.components.schemas[resource] = validatedResource;

      await fs.mkdir(SCHEMAS_DIR, { recursive: true });
      await fs.writeFile(`${SCHEMAS_DIR}/${resource}.json`, JSON.stringify(validatedResource, null, 2));

      const { meta } = extractedSchema.properties;

      if (meta && resource !== 'settings') {
        meta.properties.pagination.properties.next = {
          type: ['integer', 'null'],
        };
        meta.properties.pagination.properties.prev = {
          type: ['integer', 'null'],
        };
        await fs.writeFile(`${SCHEMAS_DIR}/meta.json`, JSON.stringify(meta, null, 2));
      }
    }

    // Alter parameters to match OAS format
    if (spec.paths[specKey].get.parameters) {
      for (const param of spec.paths[specKey].get.parameters) {
        delete param.schema.default;
        param.description = 'filter them posts, bois';

        if (param.name === 'key') {
          param.required = true;
        }
      }

      if (method === 'id' || method === 'slug') {
        spec.paths[specKey].get.parameters.push({
          description: `${method}`,
          in: 'path',
          name: `${method}`,
          required: true,
          schema: {
            type: 'string',
            example: '...',
          },
        });
      }

      // Will likely want to update
      if (resource !== 'settings') {
        spec.paths[specKey].get.parameters.push({
          description: `Select fields to return`,
          in: 'query',
          name: `field`,
          schema: {
            type: 'string',
            example: 'fields=id,title,slug',
          },
        });
      }

      // Let's sort the parameters by name
      spec.paths[specKey].get.parameters.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }

        if (a.name > b.name) {
          return 1;
        }

        return 0;
      });
    }

    // Add paths to an object to be added to the template
    pathsToAdd[buildUrl(resource, method)] = {
      $ref: `./paths/${resource}-${method}.json`,
    };

    const extractedPathMethod = spec.paths[specKey];
    const [fetchMethod] = Object.keys(extractedPathMethod);

    // Rewrite summary
    let summary;
    if (method === 'browse') {
      summary = `${capitalizeFirstLetter(fetchMethod)} all ${resource}`;
    } else {
      summary = `${capitalizeFirstLetter(
        fetchMethod
      )} ${resource} by ${method}`;
    }
    extractedPathMethod[fetchMethod].summary = summary;

    // extract method from spec
    const filenameForPath = `${PATHS_DIR}/${resource}-${method}.json`;
    await fs.writeFile(
      filenameForPath,
      JSON.stringify(extractedPathMethod, null, 2)
    );
  }
  return pathsToAdd;
}

const pathsToAdd = await modifyHarFiles();

parsedTemplate.paths = { ...pathsToAdd };

await fs.writeFile(
  `${OAS_DIR}/openapi.json`,
  JSON.stringify(parsedTemplate, null, 2)
);
