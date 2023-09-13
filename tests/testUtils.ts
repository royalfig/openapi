import { config } from 'dotenv';
config();

export function urlConstructor(
  type = 'content',
  path: string,
  includeKey: boolean,
  includeParams: boolean,
  validationError: boolean = false,
  browse = false,
) {
  const basePath = 'https://openapi.ghost.io/ghost/api';

  const endpoints = ['posts', 'pages', 'tags', 'authors', 'settings', 'tiers'];
  const endpoint = endpoints.find((str) => path.includes(str));

  let includesValue: string | null;

  switch (endpoint) {
    case 'authors':
    case 'tags':
      includesValue = 'count.posts';
      break;
    case 'tiers':
      includesValue = 'benefits,monthly_price,yearly_price';
      break;
    default:
      includesValue = 'authors,tags';
  }

  type Params = {
    include?: string;
    formats?: string;
    filter?: string;
    order?: string;
    limit?: string;
    page?: string;
    key?: string;
  }

  let params: Params = {
    include: includesValue,
    formats: 'html,plaintext',
    filter: 'visibility:public',
    order: 'published_at desc',
    limit: validationError ? 'a' : '1',
    page: '1',
    key: process.env.CONTENT_API_KEY,
  };

  if (!browse) {
    delete params.filter;
    delete params.page;
    delete params.limit;
    delete params.order;
  }

  if (endpoint !== 'posts' && endpoint !== 'pages') {
    delete params.formats;
  }

  
  if (!includeKey) {
    delete params.key;
  }

  if (!includeParams) {
    params = {};
  }

  if (endpoint === 'settings') {
    params = {
      key: process.env.CONTENT_API_KEY,
    };
  }

  const serializedParams = new URLSearchParams(params).toString();
  
  return `${basePath}/${type}/${path}/?${serializedParams}`;
}
