import fs from 'fs/promises';
import {generateSpec} from 'har-to-openapi';

async function writeOas(folder) {
    await fs.mkdir(`./test/${folder}`, {recursive: true});

    const files = await fs.readdir(`./HAR/${folder}`);

    for (const file of files) {
        console.log('🚀 ~ file: write-har-file.js:10 ~ writeOas ~ file:', file);
        const har = await fs.readFile(`./HAR/${folder}/${file}`, 'utf-8');
        const {spec} = await generateSpec(JSON.parse(har));
        await fs.writeFile(`./test/${folder}/${file}`, JSON.stringify(spec));
    }
}

await writeOas('content');
await writeOas('admin');
