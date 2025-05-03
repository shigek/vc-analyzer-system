import { promises as fs } from 'fs';

import * as path from 'path';

export async function loadRegistry(
  filePath: string,
): Promise<Map<string, string>> {
  try {
    const fileCntent = await fs.readFile(filePath, { encoding: 'utf8' });
    const registryObject: { [key: string]: string } = JSON.parse(fileCntent);
    const registryMap = new Map<string, string>(Object.entries(registryObject));
    // console.log(`Registry loaded from ${filePath}`);
    return registryMap;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(
        `Registry file not found at ${filePath}. Starting with empty registry.`,
      );
      return new Map<string, string>();
    }
    console.error(`Failed to load registry from ${filePath}:`, error);
    throw new Error(`Failed to load registry from ${filePath}`);
  }
}

export async function saveRegistry(
  registry: Map<string, string>,
  filePath: string,
): Promise<void> {
  try {
    const registryObject: { [key: string]: string } = Object.fromEntries(
      registry.entries(),
    );

    const jsonString = JSON.stringify(registryObject, null, 2);
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, jsonString, { encoding: 'utf8' });
    // console.log(`Registry saved to ${filePath}`);
  } catch (error: any) {
    console.error(`Failed to save registry to ${filePath}:`, error);
    throw new Error(`Failed to save registry to ${filePath}`);
  }
}
