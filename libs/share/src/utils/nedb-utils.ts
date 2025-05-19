import fs from 'fs';
import Nedb from '@seald-io/nedb';
import Datastore from '@seald-io/nedb';
export const openDB = async (filename: string) => {
  const db = new Datastore({ filename, autoload: true });
  await db.loadDatabaseAsync();
  return db;
};
export const importTable = async (args: any) => {
  const file = args['input'];
  deleteTable(args['db']);
  const db = openDB(args['db']);
  for (const line of readLine(file)) {
    if (line.length === 0) {
      break;
    }
    await (await db).insertAsync(JSON.parse(line.replace('\n', '')));
  }
  return true;
};
export const exportTable = async (args: any) => {
  const file = args['output'];
  const documents = await findTable(args);
  writeJSON(file, documents);
  return true;
};
export const findTable = async (args: any) => {
  const db = await openDB(args['db']);
  const cursor = db.findAsync(JSON.parse(args['condition']));
  const document = await cursor.execAsync();
  return document;
};
export const findOne = async (
  db: Promise<Nedb<Record<string, any>>>,
  args: any,
) => {
  const cursor = (await db).findAsync(JSON.parse(args['condition']));
  const document = await cursor.execAsync();
  return document[0];
};

export const writeJSON = (file: string, rows: any[]) => {
  const stream = fs.createWriteStream(file);
  for (const row of rows) {
    stream.write(JSON.stringify(row) + '\n');
  }

  // エラー処理
  stream.on('error', (err) => {
    if (err) console.log(err.message);
  });
};
export const readLine = (file: string) => {
  var text = fs.readFileSync(file, 'utf8');
  var lines = text.toString().split('\n');
  return lines;
};
export const deleteTable = (file: string) => {
  fs.unlink(file, (err) => {
    if (err) return false;
    return true;
  });
};
