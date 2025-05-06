import { promises as fs } from 'fs';
export async function readFile(path: string): Promise<any> {
  const data = await fs
    .readFile(path, 'utf8')
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.error(`Error reading context file "${path}":`, err);
      throw err;
    });
  console.log(data);
  return data;
}
