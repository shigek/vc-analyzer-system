import fs from 'fs';
import path from 'path';
export interface KeyData {
  type: string;
  key?: string;
  public: string;
  private: string;
}

export class KeyFileDataLoader {
  keyMap: Map<string, KeyData>;
  constructor() {
    this.keyMap = new Map();
  }
  addStatic(key: string, keyData: KeyData) {
    this.keyMap.set(key, keyData);
  }
  get(key: string) {
    return this.keyMap.get(key);
  }
  static keyload(url: string): { key: string } {
    const protocol = url.split('://')[0];
    if (!protocol) {
      console.error(`Failed to file path from: ${url}`);
      throw new Error(`Failed to file path: ${url}`);
    }
    if (protocol !== 'file') {
      console.error(`Unsupported protocol: ${url}`);
      throw new Error(`Unsupported protocol: ${url}`);
    }
    try {
      const file = `${url.replace('file://', '')}.key`;
      const filePath = path.join(__dirname, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const keyData = JSON.parse(data) as KeyData;
      const key = keyData.key! || keyData.public!;
      return { key };
    } catch (error) {
      console.error(`Failed to load keyfile from ${url}:`, error);
      throw new Error(`Failed to load keyfile from ${url}`);
    }
  }
}

export function fileLoader(url: string): {
  key: string;
  loader: KeyFileDataLoader;
} {
  const protocol = url.split('://')[0];
  if (!protocol) {
    console.error(`Failed to file path from: ${url}`);
    throw new Error(`Failed to file path: ${url}`);
  }
  if (protocol !== 'file') {
    console.error(`Unsupported protocol: ${url}`);
    throw new Error(`Unsupported protocol: ${url}`);
  }
  try {
    const loader = new KeyFileDataLoader();
    const file = `${url.replace('file://', '')}.key`;
    const filePath = path.join(__dirname, file);
    const data = fs.readFileSync(filePath, 'utf8');
    const keyData = JSON.parse(data) as KeyData;
    const key = keyData.key! || keyData.public!;
    loader.addStatic(key, keyData);

    return { key, loader };
  } catch (error) {
    console.error(`Failed to load keyfile from ${url}:`, error);
    throw new Error(`Failed to load keyfile from ${url}`);
  }
}
