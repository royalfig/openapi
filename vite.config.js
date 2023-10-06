import {defineConfig} from 'vite';
import fs from 'fs/promises';

const inputFiles = [];

fs.readdir('public').then((files) => {
    for (const file of files) {
        if (!file.endsWith('.html')) {
            continue;
        }
        inputFiles.push(`public/${file}`);
    }
});

export default defineConfig({
    build: {
        rollupOptions: {
            input: inputFiles
        }
    }
});
