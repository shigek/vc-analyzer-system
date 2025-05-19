import { DataAccesser } from '../interfaces/data-type.intercase';
import * as path from 'path';
import Nedb from '@seald-io/nedb';
import Datastore from '@seald-io/nedb';

export class NedbCacheAccessor implements DataAccesser {
  private cache: Nedb<Record<string, any>>;
  private readonly path: string;
  constructor(url: string) {
    const path = url.replace('file://', '');
    this.path = path;
  }
  async loadToCache(options: { path: string }): Promise<void> {
    const filename = path.join(__dirname, this.path, options.path);
    try {
      this.cache = new Datastore({ filename, autoload: true });
      await this.cache.loadDatabaseAsync();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(
          `Registry file not found at ${filename}. Starting with empty registry.`,
        );
      }
      console.warn(`Failed to load registry from ${filename}:`, error);
      //throw new Error(`Failed to load registry from ${filePath}`);
    }
  }
  async getCache(): Promise<any> {
    return await findTable(this.cache, {});
  }
  async removeValue(options: any): Promise<void> {
    removeOne(this.cache, options.key);
    await this.cache.loadDatabaseAsync();
  }
  async contains(options: { key: string }): Promise<boolean> {
    return await contains(this.cache, options);
  }
  async getValue(options: { [key: string]: any }): Promise<any> {
    return await findOne(this.cache, options);
  }
  async putValue(options: { [key: string]: any }): Promise<any> {
    await insert(this.cache, options.value);
  }
  async updateValue(options: { [key: string]: any }): Promise<any> {
    await updateOne(this.cache, options.key, options.value);
    await this.cache.loadDatabaseAsync();
  }
  saveFromCache(_options: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
const insert = async (
  db: Nedb<Record<string, any>>,
  args: { [index: string]: any },
) => {
  const document = await db.insertAsync(args);
  return document;
};
const updateOne = async (
  db: Nedb<Record<string, any>>,
  query: { [index: string]: any },
  updateQuery: { [index: string]: any },
) => {
  const { numAffected } = await db.updateAsync(
    query,
    { $set: updateQuery },
    { multi: false },
  );
  return numAffected;
};
const findTable = async (
  db: Nedb<Record<string, any>>,
  args: { [index: string]: any },
) => {
  const document = await db.findAsync(args);
  return document;
};
const findOne = async (
  db: Nedb<Record<string, any>>,
  args: { [index: string]: any },
) => {
  const document = await db.findAsync(args);
  return document[0];
};
const removeOne = async (
  db: Nedb<Record<string, any>>,
  args: { [index: string]: any },
) => {
  await db.removeAsync(args, {});
};
const contains = async (
  db: Nedb<Record<string, any>>,
  args: { [index: string]: any },
) => {
  return !(await findOne(db, args)) ? false : true;
};
const drapDatabase = async (db: Nedb<Record<string, any>>) => {
  await db.dropDatabaseAsync();
};
