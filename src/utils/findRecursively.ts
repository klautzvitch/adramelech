import { readdir } from 'fs/promises';
import path from 'path';

export default async function findAllFiles(dir: string): Promise<string[]> {
  const files = await readdir(dir, { withFileTypes: true });
  const tsFiles: string[] = [];

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        const nestedFiles = await findAllFiles(filePath);
        tsFiles.push(...nestedFiles);
      } else if (file.name.endsWith('.ts')) {
        tsFiles.push(filePath);
      }
    })
  );

  return tsFiles;
}
