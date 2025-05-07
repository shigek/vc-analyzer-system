import { Ed25519VerificationKey2020 } from '@digitalcredentials/ed25519-verification-key-2020';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const KEY_FILE_PATH = path.join(
  __dirname,
  '../',
  '.certs',
);
const createKey = async () => {
  const keyPair = await Ed25519VerificationKey2020.generate();
  return {
    type: 'Ed25519VerificationKey2020',
    key: `did:key:${keyPair.publicKeyMultibase}`,
    private: keyPair.privateKeyMultibase,
  }
}

// JWT を生成
(async () => {
  try {
    console.log('Generated Test JWT:');
    const key = await createKey();
    const uuid = randomUUID();
    const fileName = path.join(KEY_FILE_PATH, `${uuid}.key`)
    fs.writeFileSync(fileName, JSON.stringify(key))
    console.log(`account=${uuid}`);
  } catch (e) {
    console.error("error", e);
  }
})();
