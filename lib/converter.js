import fs from 'fs/promises';
import path from 'path';
import { generateSpec } from 'har-to-openapi';
import { conversionOptions } from './oasConversionOptions.js';
import { validateOasSchema } from './validator.js';
import { paramsData } from './data.js';

export const HAR_PATH = './HAR';
const OAS_DIR = './generatedSpec';
const SCHEMAS_DIR = `${OAS_DIR}/components/schemas`;
const PATHS_DIR = `${OAS_DIR}/paths`;

export async function readJsonFile(path, file) {
  return JSON.parse(await fs.readFile(`${path}/${file}`, 'utf8'));
}

// The main template for OAS
const oasTemplate = await readJsonFile(OAS_DIR, 'openapi-template.json');

export async function getHarFiles() {
  return fs.readdir(HAR_PATH);
}

function parseResourceAndMethod(file) {
  const [resourceMethod] = file.split('.');
  return resourceMethod.split('-');
}

function generateNewSchema(resource, method) {
  if (resource === 'settings') {
    return {
      type: 'object',
      properties: {
        settings: { $ref: `../components/schemas/${resource}.json` },
        meta: { $ref: `../components/schemas/meta.json` },
      },
    };
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

  if (resource !== 'settings' && method === 'browse') {
    baseSchema.properties.meta = {
      $ref: '../components/schemas/meta.json',
    };
  }

  return baseSchema;
}

/**
 * Builds path string for OAS operation
 * @param {string} resource
 * @param {string} method
 * @returns {string} Path string
 */
function buildPath(resource, method) {
  if (method === 'id') {
    return `/${resource}/{id}`;
  }

  if (method === 'slug') {
    return `/${resource}/slug/{slug}`;
  }

  return `/${resource}`;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Extracts the schema from a HAR file
 * @param {string} file
 * @returns {object} Object containing resource, method, spec, specKey, and extractedSchema
 *
 */
async function createExtractedSchema(file, methodOverride) {
  const [resource, method] = parseResourceAndMethod(file);

  console.log(
    'Processing data for \x1b[32m' +
      resource +
      '\x1b[0m (\x1b[92m' +
      method +
      '\x1b[0m) and generating OpenAPI spec...'
  );

  const harFile = await readJsonFile(HAR_PATH, file);
  const { spec } = await generateSpec(harFile, conversionOptions);
  const specKey = Object.keys(spec.paths)[0];
  const extractedSchema =
    spec.paths[specKey].get.responses[methodOverride || method]?.content[
      'application/json'
    ].schema;

  return { resource, method, spec, specKey, extractedSchema };
}

/**
 * Creates error responses for OAS. We append error responses to each path individually
 * @param {array} files
 * @returns {object} Object containing error responses
 */
async function createErrorResponses(files) {
  let errorResponses = {};

  for (const file of files) {
    const { resource, method, spec, specKey, extractedSchema } =
      await createExtractedSchema(file);

    const extractedSchemaProperties =
      extractedSchema.properties.errors.items.properties;

    // TODO extract nullable method
    for (const props in extractedSchemaProperties) {
      if (extractedSchemaProperties[props].nullable) {
        extractedSchemaProperties[props] = {
          type: ['string', 'null'],
        };
      }
    }

    const errorResponse = spec.paths[specKey].get.responses;
    delete errorResponse[method].headers;
    //  errorResponse[method].description;
    errorResponse[method].content['application/json'].schema = {
      $ref: `../components/schemas/${method}.json`,
    };

    extractedSchema.title = `ghost${capitalizeFirstLetter(
      resource
    )} (${method})`;

    await fs.writeFile(
      `${SCHEMAS_DIR}/${method}.json`,
      JSON.stringify(extractedSchema, null, 2)
    );
    errorResponses[method] = errorResponse[method];
  }

  return errorResponses;
}

/**
 * Processes parameters for OAS
 * @param {array} params
 * @param {string} method
 */
async function processParams(params, resource, method) {
  if (!params) {
    return;
  }
  // Remove key from params because it's already included elsewhere
  const keyIndex = params.findIndex((param) => param.name === 'key');
  params.splice(keyIndex, 1);

  for (const param of params) {
    delete param.schema.default;
    param.description = paramsData[param.name].description;
  }

  if (method === 'id' || method === 'slug') {
    params.push({
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
    params.push({
      description: `Select fields to return`,
      in: 'query',
      name: `fields`,
      schema: {
        type: 'string',
        example: 'id,title,slug',
      },
    });
  }

  // Let's sort the parameters by name
  params.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }

    if (a.name > b.name) {
      return 1;
    }

    return 0;
  });
}

async function process() {
  await fs.mkdir(PATHS_DIR, { recursive: true });
  await fs.mkdir(SCHEMAS_DIR, { recursive: true });

  const generatedHarFiles = await getHarFiles();
  const pathsToAdd = {};

  const { successfulOperationFiles, errorOperationFiles } =
    generatedHarFiles.reduce(
      (acc, file) => {
        if (file.includes('error')) {
          acc.errorOperationFiles.push(file);
        } else {
          acc.successfulOperationFiles.push(file);
        }
        return acc;
      },
      {
        successfulOperationFiles: [],
        errorOperationFiles: [],
      }
    );

  const errorResponses = await createErrorResponses(errorOperationFiles);

  for (const file of successfulOperationFiles) {
    const { resource, method, spec, specKey, extractedSchema } =
      await createExtractedSchema(file, 200);

    if (extractedSchema) {
      spec.paths[specKey].get.responses[200].content[
        'application/json'
      ].schema = generateNewSchema(resource, method);

      const extractedResource =
        extractedSchema.properties[resource]?.items ||
        extractedSchema.properties[resource];

      const validatedResource = await validateOasSchema(
        extractedResource,
        resource,
        method
      );

      if (validatedResource.properties.frontmatter) {
        validatedResource.properties.frontmatter = {
          type: ['string', 'null'],
        };
      }

      await fs.writeFile(
        `${SCHEMAS_DIR}/${resource}.json`,
        JSON.stringify(validatedResource, null, 2)
      );

      const { meta } = extractedSchema.properties;

      if (meta && resource !== 'settings') {
        meta.properties.pagination.properties.next = {
          type: ['integer', 'null'],
        };
        meta.properties.pagination.properties.prev = {
          type: ['integer', 'null'],
        };
        delete meta.title;
        await fs.writeFile(
          `${SCHEMAS_DIR}/meta.json`,
          JSON.stringify(meta, null, 2)
        );
      }
    }

    const { parameters } = spec.paths[specKey].get;
    processParams(parameters, resource, method);

    // Add paths to an object to be added to the template
    pathsToAdd[buildPath(resource, method)] = {
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

    // add errorResponses to path
    extractedPathMethod[fetchMethod].responses = {
      ...extractedPathMethod[fetchMethod].responses,
      ...errorResponses,
    };

    // extract method from spec
    const filenameForPath = `${PATHS_DIR}/${resource}-${method}.json`;
    await fs.writeFile(
      filenameForPath,
      JSON.stringify(extractedPathMethod, null, 2)
    );
  }

  return pathsToAdd;
}

async function main() {
  const pathsToAdd = await process();

  oasTemplate.paths = { ...pathsToAdd };

  await fs.writeFile(
    `${OAS_DIR}/openapi.json`,
    JSON.stringify(oasTemplate, null, 2)
  );

  console.log(
    `\x1b[1m\n\nDone ✅\x1b[0m\n` +
      `──────────────────────────────────────────────────────\n` +
      `OpenAPI spec available at \x1b[36m${path.resolve(
        OAS_DIR,
        'openapi.json'
      )}\x1b[0m\n` +
      `Bundled spec available at \x1b[36m${path.resolve(
        'dist',
        'bundle.yaml'
      )}\x1b[0m\n` +
      `──────────────────────────────────────────────────────\n\n`
  );
}

await main();
