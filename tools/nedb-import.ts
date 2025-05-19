import path from 'path';
import Datastore from "@seald-io/nedb";
import fs from "fs";

const filename = path.join(__dirname, '../data', 'trusted-list-registry.db');
const input = path.join(__dirname, '../data', 'trusted-list-registry.import.json');
const db = new Datastore({ filename, autoload: true });
const readLine = (file: string) => {
  var text = fs.readFileSync(file, 'utf8');
  var lines = text.toString().split('\n');
  return lines;
}
const importTable = async () => {
  try {
    await db.dropDatabaseAsync();
    await db.loadDatabaseAsync();
    for (const line of readLine(input)) {
      if (line.length === 0) {
        break;
      }
      console.log(line);
      await db.insertAsync(JSON.parse(line.replace("\n", "")));
    }
  } catch (error) {
    console.error("errro", error);
  }
  return true;
}

// JWT を生成
(async () => {
  try {
    await db.loadDatabaseAsync();
    await importTable();
  } catch (e) {
    console.error("error", e);
  }
})();
