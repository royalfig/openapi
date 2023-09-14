import { defineConfig } from 'vite';
import fs from 'fs/promises';

const inputFiles = [];

fs.readdir('public').then((files) => {
    for (const file of files) {
        if (!file.endsWith('.html')) {continue;}
        console.log("🚀 ~ file: vite.config.js:8 ~ fs.readdir ~ file:", file)
        inputFiles.push(`public/${file}`);
    }
});

export default defineConfig({
  build: {
    rollupOptions: {
      input: inputFiles,
    },
  },
});
