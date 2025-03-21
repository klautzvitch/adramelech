import { readdir } from 'fs/promises';
import path from 'path';

export default async function findRecursively(dir: string): Promise<string[]> {
  const files = await readdir(dir, { withFileTypes: true });
  const tsFiles: string[] = [];

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        const nestedFiles = await findRecursively(filePath);
        tsFiles.push(...nestedFiles);
      } else if (file.name.endsWith('.ts')) {
        tsFiles.push(filePath);
      }
    })
  );

  return tsFiles;
}
