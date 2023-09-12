import { generateSpec, generateSpecs } from 'har-to-openapi';
import fs from 'fs/promises';

const har = await fs.readFile('./HAR/posts-browse.har', 'utf8')

const spec = await generateSpec(JSON.parse(har), {
  filterStandardHeaders: true,
  attemptToParameterizeUrl: true,
  tags: ['posts', 'authors', 'tags', 'pages', 'tiers', 'settings'],
  pathReplace: {
    welcome: ':slug',
    cameron: ':slug',
    about: ':slug',
    unknonw: ':slug',
    'getting-started': ':slug',
    '5ddc9b9510d8970038255d02': ':id',
    '5ddc9b9510d8970038255d03': ':id',
    '5ddc9b9510d8970038255d04': ':id',
    '5ddc9b9510d8970038255d05': ':id',
    '605360bbce93e1003bd6ddd6': ':id',
    '605360bbce93e1003bd6ddd7': ':id',
    '5979a779df093500228e958a': ':id',
    '5979a779df093500228e958b': ':id',
  },
  guessAuthenticationHeaders: true,
    guessResponseContentType: true,

});
