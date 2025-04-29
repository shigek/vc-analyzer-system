import fs from 'fs';
export const writeJSON = (file: string, rows: any[]) => {
  const stream = fs.createWriteStream(file);
  for (const row of rows) {
    console.log(row);
    stream.write(JSON.stringify(row) + '\n');
  }

  // エラー処理
  stream.on('error', (err) => {
    if (err) console.log(err.message);
  });
};

export const writeString = (file: string, rows: string) => {
  const stream = fs.createWriteStream(file);
  stream.write(rows + '\n');
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
