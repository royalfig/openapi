// Define additional data to add to OAS
export const additionalOasData = new Map([
    ['posts', {jsonSchemaName: 'posts', jsonSchemaIdx: 0}],
    ['authors', {jsonSchemaName: null, jsonSchemaIdx: 0}],
    ['tags', {jsonSchemaName: 'tags', jsonSchemaIdx: 0}],
    ['pages', {jsonSchemaName: 'pages', jsonSchemaIdx: 0}],
    ['tiers', {jsonSchemaName: 'tiers', jsonSchemaIdx: 0}],
    ['settings', {jsonSchemaName: null, jsonSchemaIdx: 0}]
]);

/**
 * Provide a settings schema
 * TODO - this is a temporary solution until we have a proper settings schema
 */
export const settingsSchema = {
    $schema: 'http: //json-schema.org/draft-07/schema#',
    $id: 'tiers',
    title: 'tiers',
    description: 'Base Tier definitions',
    definitions: {
        tier: {
            description: 'A Ghost Tier',
            type: 'object',
            additionalProperties: false,
            properties: {
                accent_color: {
                    type: ['string', 'null']
                },
                allow_self_signup: {
                    type: 'boolean'
                },
                codeinjection_foot: {
                    type: ['string', 'null']
                },
                codeinjection_head: {
                    type: ['string', 'null']
                },
                comments_enabled: {
                    type: 'string'
                },
                cover_image: {
                    format: 'uri',
                    type: ['string', 'null'],
                    'x-qt-uri-extensions': ['.jpg'],
                    'x-qt-uri-protocols': ['https']
                },
                description: {
                    type: ['string', 'null']
                },
                facebook: {
                    type: ['string', 'null']
                },
                firstpromoter_account: {
                    type: ['string', 'null']
                },
                icon: {
                    type: ['string', 'null']
                },
                lang: {
                    type: 'string'
                },
                locale: {
                    type: 'string'
                },
                logo: {
                    type: ['string', 'null']
                },
                members_enabled: {
                    type: 'boolean'
                },
                members_invite_only: {
                    type: 'boolean'
                },
                members_support_address: {
                    type: 'string'
                },
                meta_description: {
                    type: ['string', 'null']
                },
                meta_title: {
                    type: ['string', 'null']
                },
                navigation: {
                    items: {
                        additionalProperties: false,
                        properties: {
                            label: {
                                type: 'string'
                            },
                            url: {
                                type: 'string'
                            }
                        },
                        required: [],
                        title: 'Navigation',
                        type: 'object'
                    },
                    type: 'array'
                },
                og_description: {
                    type: ['string', 'null']
                },
                og_image: {
                    type: ['string', 'null']
                },
                og_title: {
                    type: ['string', 'null']
                },
                paid_members_enabled: {
                    type: 'boolean'
                },
                portal_button: {
                    type: 'boolean'
                },
                portal_button_icon: {
                    type: ['string', 'null']
                },
                portal_button_signup_text: {
                    type: 'string'
                },
                portal_button_style: {
                    type: 'string'
                },
                portal_name: {
                    type: 'boolean'
                },
                portal_plans: {
                    items: {
                        type: 'string'
                    },
                    type: 'array'
                },
                portal_signup_checkbox_required: {
                    type: 'boolean'
                },
                portal_signup_terms_html: {
                    type: ['string', 'null']
                },
                recommendations_enabled: {
                    type: 'boolean'
                },
                secondary_navigation: {
                    items: {
                        additionalProperties: false,
                        properties: {
                            label: {
                                type: 'string'
                            },
                            url: {
                                type: 'string'
                            }
                        },
                        required: [],
                        title: 'Navigation',
                        type: 'object'
                    },
                    type: 'array'
                },
                timezone: {
                    type: 'string'
                },
                title: {
                    type: 'string'
                },
                twitter: {
                    type: ['string', 'null']
                },
                twitter_description: {
                    type: ['string', 'null']
                },
                twitter_image: {
                    type: ['string', 'null']
                },
                twitter_title: {
                    type: ['string', 'null']
                },
                url: {
                    format: 'uri',
                    type: 'string',
                    'x-qt-uri-protocols': ['https']
                },
                version: {
                    type: 'string'
                }
            }
        }
    }
};
/**
 * Provide an authors schema
 * TODO - this is a temporary solution until we have a proper authors schema
 */
export const authorsSchema = {
    $schema: 'http: //json-schema.org/draft-07/schema#',
    $id: 'tiers',
    title: 'tiers',
    description: 'Base Tier definitions',
    definitions: {
        tier: {
            description: 'A Ghost Tier',
            additionalProperties: false,
            properties: {
                bio: {
                    type: ['string', 'null']
                },
                count: {
                    additionalProperties: false,
                    properties: {
                        posts: {
                            type: 'integer'
                        }
                    },
                    required: [],
                    title: 'Count',
                    type: 'object'
                },
                cover_image: {
                    type: ['string', 'null']
                },
                facebook: {
                    type: ['string', 'null']
                },
                id: {
                    format: 'integer',
                    type: 'string'
                },
                location: {
                    type: ['string', 'null']
                },
                meta_description: {
                    type: ['string', 'null']
                },
                meta_title: {
                    type: ['string', 'null']
                },
                name: {
                    type: 'string'
                },
                profile_image: {
                    type: ['string', 'null']
                },
                slug: {
                    type: 'string'
                },
                twitter: {
                    type: ['string', 'null']
                },
                url: {
                    format: 'uri',
                    type: 'string',
                    'x-qt-uri-protocols': ['https']
                },
                website: {
                    type: ['string', 'null']
                }
            },
            required: [],
            title: 'Author',
            type: 'object'
        }
    }
};

export const paramsData = {
    include: {
        description: 'Tells the API to return additional data related to the resource you have requested. Doesn\'t work well with `fields`'
    },
    fields: {
        description: 'Select fields to return. Doesn\'t work well with `include`'
    },
    filter: {
        description: 'Filter the result set to only include resources that match the provided criteria'
    },
    formats: {
        description: 'Return `HTML` or `plaintext`'
    },
    limit: {
        description: 'Limit the number of resources in the response'
    },
    page: {
        description: 'Paginate through collections of resources. By default, the first 15 records are returned.'
    },
    order: {
        description: 'Order the returned resources.'
    }
};