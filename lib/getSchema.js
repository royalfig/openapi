import fs from 'fs/promises';
const LIB_PATH = './lib/schema.cjs';

export async function getSchema() {
  // Check if file already exists
  try {
    await fs.readFile(LIB_PATH);
    const schema = await import('./schema.cjs');
    return schema.default;
  } catch (error) {
    console.log('Schema file does not exist, fetching from GitHub');
  }

  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/TryGhost/Ghost/main/ghost/core/core/server/data/schema/schema.js'
    );
    const text = await res.text();
    await fs.writeFile(LIB_PATH, text);

    const schema = await import('./schema.cjs');
    return schema.default;
  } catch (error) {
    throw new Error(`Error fetching schema: ${error}`);
  }
}
