import fs from 'fs/promises';
import { generateSpec } from 'har-to-openapi';
import { conversionOptions } from './oasConversionOptions.js';
import { validateOasSchema } from './validator.js';

const HAR_PATH = './HAR';
const OAS_DIR = './generatedSpec';
const SCHEMAS_DIR = `${OAS_DIR}/components/schemas`;
const PATHS_DIR = `${OAS_DIR}/paths`;

const template = await fs.readFile(`${OAS_DIR}/openapi-template.json`);
const oasTemplate = JSON.parse(template);

/**
 * Gets generated HAR files in the HAR directory
 * @returns {Promise<string[]>} List of HAR file names
 */
async function getHarFiles() {
  return fs.readdir(HAR_PATH);
}

/**
 * Reads contents of a HAR file
 * @param {string} harFile - File name
 * @returns {Promise<string>} HAR file contents
 */
async function readHarFile(file) {
  return fs.readFile(`${HAR_PATH}/${file}`, 'utf8');
}

/**
 * Parses resource and method from HAR file name
 * @param {string} fileName
 * @returns {[string, string]} Resource and method
 */
function parseResourceAndMethod(file) {
  const [resourceMethod] = file.split('.');
  return resourceMethod.split('-');
}

function generateNewSchema(resource) {
  console.log(
    '🚀 ~ file: converter.js:42 ~ generateNewSchema ~ resource:',
    resource
  );
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

async function createErrorResponses(files) {
  let errorResponses = {};

  for (const file of files) {
    const [resource, method] = parseResourceAndMethod(file);

    const harFile = await readHarFile(file);
    const { spec } = await generateSpec(JSON.parse(harFile), conversionOptions);
    const specKey = Object.keys(spec.paths)[0];
    const extractedSchema =
      spec.paths[specKey].get.responses[method]?.content['application/json']
        .schema;

    // TODO extract nullable method
    for (const props in extractedSchema.properties.errors.items.properties) {
      if (extractedSchema.properties.errors.items.properties[props].nullable) {
        extractedSchema.properties.errors.items.properties[props] = {
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
    const [resource, method] = parseResourceAndMethod(file);

    const harFile = await readHarFile(file);
    const { spec } = await generateSpec(JSON.parse(harFile), conversionOptions);
    const specKey = Object.keys(spec.paths)[0];
    const extractedSchema =
      spec.paths[specKey].get.responses[200]?.content['application/json']
        .schema;

    if (extractedSchema) {
      spec.paths[specKey].get.responses[200].content[
        'application/json'
      ].schema = generateNewSchema(resource);

      const extractedResource =
        extractedSchema.properties[resource]?.items ||
        extractedSchema.properties[resource];

      const validatedResource = await validateOasSchema(
        extractedResource,
        resource,
        method
      );

      await fs.writeFile(
        `${SCHEMAS_DIR}/${resource}.json`,
        JSON.stringify(validatedResource, null, 2)
      );

      const { meta } = extractedSchema.properties;

      if (meta && resource !== 'settings') {
        meta.properties.pagination.properties.next = {
          type: ['integer', 'null'],
        }
        meta.properties.pagination.properties.prev = {
          type: ['integer', 'null'],
        };
        delete meta.title
        await fs.writeFile(
          `${SCHEMAS_DIR}/meta.json`,
          JSON.stringify(meta, null, 2)
        );
      }
    }

    // Alter parameters to match OAS format
    if (spec.paths[specKey].get.parameters) {
      // Remove key from params because it's already included elsewhere

      const keyIndex = spec.paths[specKey].get.parameters.findIndex(
        (param) => param.name === 'key'
      );
      spec.paths[specKey].get.parameters.splice(keyIndex, 1);

      for (const param of spec.paths[specKey].get.parameters) {
        delete param.schema.default;
        param.description = 'filter them posts, bois';
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
          name: `fields`,
          schema: {
            type: 'string',
            example: 'id,title,slug',
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
}

await main();
