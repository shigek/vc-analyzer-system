// 例: generate-test-jwt.js (簡単な Node.js スクリプトとして実行)

import { signToken, verify } from "./jsonwebtoken";
import path from 'path';

// JWT に含めるペイロード（JwtStrategy の validate メソッドが期待する内容）
// Client Credentials フローなので、クライアントを識別する情報を含めます。
const testPayload = {
  sub: 'vc-analyzer-admin-client', // 例: クライアントID
  clientId: 'vc-analyzer-admin-client', // カスタムクレームとして含める場合
  scope: 'trusted-list:admin,status-list:admin', // scopeクレームを利用する場合
  scopes: ['trusted-list:admin', 'status-list:admin'] // 別のクレームを使う場合
};

// JWT の有効期限（アプリケーションの設定と合わせると良い）
const jwtOptions = {
  expiresIn: '60m',
  algorithm: 'RS256'
};


const KEY_FILE_PATH = path.join(
  __dirname,
  '../',
  '.certs',
  '1b568dbd-1113-432d-9279-f9b8760725c2.key',
);


// JWT を生成
(async () => {
  try {
    console.log('Generated Test JWT:');
    const token = await signToken(testPayload, KEY_FILE_PATH, { kid: '1b568dbd-1113-432d-9279-f9b8760725c2' },
          jwtOptions);
    console.log(token);
    await verify(token, KEY_FILE_PATH);
    console.log('\nUse this token in the Authorization: Bearer <token> header.');
  } catch (e) {
    console.error("error", e);
  }
})();
