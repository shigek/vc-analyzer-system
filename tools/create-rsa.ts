// 例: generate-test-jwt.js (簡単な Node.js スクリプトとして実行)
import rsa from 'js-crypto-rsa'
import { signToken, verify } from "./jsonwebtoken";
import path from 'path';
import { randomUUID } from 'crypto';

const KEY_FILE_PATH = path.join(
  __dirname,
  '../',
  '.certs',
  `${randomUUID()}.key`,
);


// JWT を生成
(async () => {
  console.log(randomUUID());
})();
