/**
 * Creates an OpenAPI 3.1.0 specification object based on the provided parameters.
 *
 * @function
 * @param {string} title - The title of the API.
 * @param {string} summary - A short summary of the API.
 * @param {string} docs - A reference to the documentation file.
 * @param {string} server - The URL of the server where the API is hosted.
 * @param {Object[]} security - A list of security schemes for the API.
 * @param {Object[]} tags - A list of tags used by the API for organization.
 * @param {Object} securitySchemes - The security schemes available for the API.
 * @param {Object} schemas - The schemas defined for the API.
 * @param {Object} paths - The paths defined for the API.
 * @returns {Object} An object representing the OpenAPI 3.1.0 specification.
 * @example
 * const openApiSpec = renderBaseSchema(
 *   "Ghost Content API", 
 *   "Ghost's RESTful Content API ...",
 *   "./content-api.md",
 *   "https://{user.url}/ghost/api/content",
 *   [{ api_key: [] }],
 *   [ ...tags data... ],
 *   { api_key: { type: "apiKey", in: "query", name: "key" } },
 *   {},
 *   {}
 * );
 */
export const renderBaseSchema = (title, summary, docs, server, security, tags, securitySchemes, paths) => ({
    openapi: '3.1.0',
    info: {
        title: title,
        version: '1.0.0',
        summary: summary,
        // description: {
        //     $ref: docs
        // },
        contact: {
            name: 'Ghost',
            url: 'https://ghost.org'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: server,
    security:
        security
    ,
    tags: 
        tags
    ,
    paths: paths,
    components: {
        securitySchemes: securitySchemes,
        schemas: {}
    }
});

export const securityMap = {
    content: [{api_key: []}],
    admin: [{admin_key: []}]
};

export const tagsMap = {
    content: [
        {
            name: 'Posts',
            description: 'Posts are the primary resource in a Ghost site. Using the posts endpoint it is possible to get lists of posts filtered by various criteria.',
            externalDocs: {
                description: 'Posts API Documentation',
                url: 'https://ghost.org/docs/content-api/#posts'
            }
        }
    ],
    admin: [{name: 'Posts',
        description: 'Posts are the primary resource in a Ghost site. Using the posts endpoint it is possible to get lists of posts filtered by various criteria.',
        externalDocs: {
            description: 'Posts API Documentation',
            url: 'https://ghost.org/docs/content-api/#posts'
        }}]

};

export const securitySchemesMap = {content: {api_key: {
    type: 'apiKey',
    in: 'query',
    name: 'key'
}},
admin: {admin_key: {
    type: 'apiKey',
    in: 'query',
    name: 'key'
}}};

export const serverMap = {
    content: [
        {url: 'https://{user.url}/ghost/api/content', variables: {
            'user.url': {
                default: 'demo.ghost.io'
            }
        }}],
    admin: [
        {url: 'https://{user.url}/ghost/api/admin', variables: {
            'user.url': {
                default: 'demo.ghost.io'
            }
        }}]
};