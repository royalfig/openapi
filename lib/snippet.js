import { HTTPSnippet } from 'httpsnippet-lite';
import fs from 'fs/promises';
import { HAR_PATH, getHarFiles, readJsonFile } from './converter.js';

/*
 * Because not all UIs support automatic snippet generation, this library can generate the snippets for us. Still researching...
 *
 */
async function writeSnippet(snippet, file) {
  if (!snippet) {
    return;
  }
 
  fs.writeFile(`./snippets/${file}`, snippet, 'utf8');
}

const harFiles = await getHarFiles();

for (const file of harFiles) {
  if (file.includes('error')) {
    continue;
  }
  const har = await readJsonFile(HAR_PATH, file);

  const snippet = new HTTPSnippet(har);
  const options = { pretty: true };
  const shell = await snippet.convert('shell', 'curl', options);
  writeSnippet(shell, `${file}.sh`);

  const node = await snippet.convert('node', 'native', options);
  writeSnippet(node, `${file}.js`);

  const javascript = await snippet.convert('javascript', 'fetch', options);
  writeSnippet(javascript, `${file}.js`);

  const php = await snippet.convert('php', 'curl', options);
  writeSnippet(php, `${file}.php`);

  const python = await snippet.convert('python', 'requests', options);
  writeSnippet(python, `${file}.py`);

  const ruby = await snippet.convert('ruby', 'native', options);
  writeSnippet(ruby, `${file}.rb`);

  const go = await snippet.convert('go', 'native', options);
  writeSnippet(go, `${file}.go`);

  const java = await snippet.convert('java', 'unirest', options);
  writeSnippet(java, `${file}.java`);

  const csharp = await snippet.convert('csharp', 'restsharp', options);
  writeSnippet(csharp, `${file}.cs`);


}
