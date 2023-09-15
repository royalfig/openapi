## API Clients

**JavaScript Client Library**
We’ve developed an [API client for JavaScript](https://ghost.org/docs/content-api/javascript/) that will allow you to quickly and easily interact with the Content API. The client is an advanced wrapper on top of our REST API - everything that can be done with the Content API can be done using the client, with no need to deal with the details of authentication or the request & response format.

## URL

`https://{admin_domain}/ghost/api/content/`

Your admin domain can be different to your site domain. Using the correct domain and protocol are critical to getting consistent behaviour, particularly when dealing with CORS in the browser. All Ghost(Pro) blogs have a \*.ghost.io domain as their admin domain and require https.

## Key

`?key={key}`

Content API keys are provided via a query parameter in the URL. These keys are safe for use in browsers and other insecure environments, as they only ever provide access to public data. Sites in private mode should consider where they share any keys they create.

Obtain the Content API URL and key by creating a new Custom Integration under the Integrations screen in Ghost Admin.

![](https://ghost.org/images/docs/apikey_huc23d3a1fbe859434094a9db94f574d9a_265920_2920x0_resize_q100_h2_box_3.webp)

## Accept-Version Header

`Accept-Version: v{major}.{minor}`

Use the `Accept-Version` header to indicate the minimum version of Ghost's API to operate with. See [API Versioning](https://ghost.org/docs/faq/api-versioning/) for more details.
