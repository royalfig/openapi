import fs from 'fs/promises';
import { generateSpec } from 'har-to-openapi';
import { conversionOptions } from './generateOpenAPISpec.js';
import { matchOasToGhostSchema } from './matchOasToGhostSchema.js';

const HAR_PATH = './HAR';
const OAS_DIR = './generatedSpec';
const template = await fs.readFile(`${OAS_DIR}/openapi-template.json`, 'utf8');
const parsedTemplate = JSON.parse(template);
// Get all the HAR files generated from Playwright

async function modifyHarFiles() {
  const generatedHarFiles = await fs.readdir(HAR_PATH);

  // Build out the paths to add to the template
  const pathsToAdd = {};

  for (const file of generatedHarFiles) {
    const extensionIdx = file.indexOf('.');
    const [resource, method] = file.slice(0, extensionIdx).split('-');

    await fs.mkdir(`${OAS_DIR}/paths`, { recursive: true });
    let cd = `${OAS_DIR}/paths`;

    const harFile = await fs.readFile(`${HAR_PATH}/${file}`, 'utf8');

    // Generate the OAS spec from the file
    const { spec } = await generateSpec(JSON.parse(harFile), conversionOptions);

    const specKey = Object.keys(spec.paths);

    const extractedSchema =
      spec.paths[specKey[0]].get.responses[200]?.content['application/json']
        .schema;

    let newSchema = {
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

    if (resource === 'settings') {
      newSchema = {
       
          $ref: `../components/schemas/${resource}.json`,
        
      };
    }

    if (method === 'browse' && resource !== 'settings') {
      newSchema.properties.meta = {
        type: 'object',
        properties: {
          $ref: '../components/schemas/meta.json',
        },
      };
    }

    if (extractedSchema) {
      spec.paths[specKey[0]].get.responses[200].content[
        'application/json'
      ].schema = newSchema;


      const extractedResource =
        extractedSchema.properties[resource]?.items ||
        extractedSchema.properties[resource];

      // const validatedResource = await matchOasToGhostSchema(
      //   extractedResource,
      //   resource
      // );

      const validatedResource = extractedResource;
      // parsedTemplate.components.schemas.meta = meta;
      // parsedTemplate.components.schemas[resource] = validatedResource;

      await fs.mkdir(`${OAS_DIR}/components/schemas`, { recursive: true });
      await fs.writeFile(
        `${OAS_DIR}/components/schemas/${resource}.json`,
        JSON.stringify(validatedResource, null, 2),
        'utf8'
      );

      const { meta } = extractedSchema.properties;


      if (meta && resource !== 'settings') {
        meta.properties.pagination.properties.next = {
          type: ['integer', 'null'],
        };
        meta.properties.pagination.properties.prev = {
          type: ['integer', 'null'],
        };
        await fs.writeFile(
          `${OAS_DIR}/components/schemas/meta.json`,
          JSON.stringify(meta, null, 2),
          'utf8'
        );
      }
    }

    // Alter parameters to match OAS format
    if (spec.paths[specKey[0]].get.parameters) {
      for (const param of spec.paths[specKey[0]].get.parameters) {
        delete param.schema.default;
        param.description = 'filter them posts, bois';

        if (param.name === 'key') {
          param.required = true;
        }
      }

      if (method === 'id' || method === 'slug') {
        spec.paths[specKey[0]].get.parameters.push({
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
        spec.paths[specKey[0]].get.parameters.push({
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
      spec.paths[specKey[0]].get.parameters.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }

        if (a.name > b.name) {
          return 1;
        }

        return 0;
      });
    }

    function parameterizePath(str) {
      str = str.replace(/:(\w+)/g, '{$1}');
      return str;
    }

    // Add paths to an object to be added to the template
    pathsToAdd[parameterizePath(specKey[0])] = {
      $ref: `./paths/${resource}-${method}.json`,
    };

    const extractedPathMethod = spec.paths[specKey[0]];
    const [fetchMethod] = Object.keys(extractedPathMethod);

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

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
    const filenameForPath = `${cd}/${resource}-${method}.json`;
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
  JSON.stringify(parsedTemplate, null, 2),
  'utf8'
);
