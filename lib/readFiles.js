import fs from 'fs/promises';

// Read in all files with .har extension
export async function readFiles(dirname, ext) {
  // Check if directory exists
  try {
    await fs.access(dirname);
  } catch (error) {
    throw new Error(`Directory ${dirname} does not exist`);
  }

  return await fs.readdir(dirname);
  // const filteredFiles = files.filter((file) => file.endsWith(ext));
  return filteredFiles.map((file) => `${dirname}/${file}`);
}

export async function combineFileContents(files) {
  const mainFile = await fs.readFile(files[0], 'utf8');
  const file2 = JSON.parse(await fs.readFile(files[1], 'utf8'));
  let mainFileJSON = JSON.parse(mainFile);
  for (let i = 1; i < files.length; i++) {
    const file = await fs.readFile(files[i], 'utf8');
    const fileJSON = JSON.parse(file);

    mainFileJSON.log.entries = [...mainFileJSON.log.entries, ...fileJSON?.log?.entries];
  }

  return mainFileJSON;
}
