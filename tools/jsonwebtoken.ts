import jose from 'jose';
import { promises as fs } from 'fs';

// Sign the JWT
export async function signToken(payload: { [index: string]: any }, pem: string, jwtOptions: { expiresIn: string }) {
  const key = await readPem(pem);
  const jsonKey = JSON.parse(key);
  const privateKey = await jose.importPKCS8(jsonKey.private, jsonKey.algorithm);
  const jwt = await (new jose.SignJWT(payload)
    .setProtectedHeader({ alg: jsonKey.algorithm })
    .setIssuedAt()
    .setExpirationTime(jwtOptions.expiresIn)
    .sign(privateKey));
  return jwt;
}

export async function readPem(path: string): Promise<any> {
  const pem = fs.readFile(path, 'utf8')
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.error(
        `Error reading context file "${path}":`,
        err,
      );
      throw err;
    });
  return await pem;
}

export async function verify(token: string, pem: string) {
  const key = await readPem(pem);
  const jsonKey = JSON.parse(key);
  const publicKey = await jose.importSPKI(jsonKey.public, jsonKey.algorithm);
  const result = await jose.jwtVerify(token, publicKey);
  console.log(result);
}
