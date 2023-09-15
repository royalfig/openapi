Generate an OpenAPI spec and UI from HAR files.

## Scripts

```bash
npm run generate
```
- Runs Playwright tests to generate the HAR files **Requires an API key in `.env`**
- Converts the HAR files into OAS files
- Bundles the OAS files
- Validates the OAS bundle

```bash
npm run bundle
```
Bundles the OAS files

```bash
npm run convert
```
Converts the HAR files into OAS files

```bash
npm run lint:oas
```
Validates the OAS bundle

```bash
npm run test
```
Creates the HAR files

```bash
npm run dev
```
Launches the docs UI in a variety of formats. Append any of these filenames to the base path:
- stoplight.html
- rapid.html
- redoc.html
- swagger.html

```bash
npm run types
```
Generates TS types based on the OAS