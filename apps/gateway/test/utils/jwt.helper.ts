import { Buffer } from 'buffer'; // Node.js 環境で Buffer を使う場合

/**
 * テスト用のダミーJWTを作成するヘルパー関数
 * 実際の署名検証は行わないため、セキュリティには依存しないこと
 *
 * @param payload JWTのペイロードオブジェクト
 * @param header JWTのヘッダーオブジェクト (alg, kid など)
 * @param signature ダミーの署名文字列
 * @returns 生成されたJWT文字列
 */
export function createTestJwt(
  payload: Record<string, any> = {},
  header: Record<string, any> = {},
  signature: string = 'dummy_signature_part',
): string {
  // デフォルトのヘッダーを設定
  const defaultHeader = {
    alg: 'HS256', // 署名アルゴリズム
    typ: 'JWT', // トークンのタイプ
    kid: 'test-kid', // デフォルトのkid
    ...header, // 引数で渡されたヘッダーで上書き
  };

  const headerEncoded = Buffer.from(JSON.stringify(defaultHeader)).toString(
    'base64url',
  );
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );

  // JWTは "header.payload.signature" 形式
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * 特定の kid を持つテスト用JWTを簡単に作成するヘルパー
 * @param kid 設定するkid
 * @param payload JWTのペイロード
 * @returns 生成されたJWT文字列
 */
export function createTestJwtWithKid(
  kid: string,
  payload: Record<string, any> = {},
): string {
  return createTestJwt(payload, { kid: kid });
}

/**
 * 無効な形式のJWTを作成するヘルパー
 * @param headerPart ヘッダー部分 (不正な形式にする場合)
 * @param payloadPart ペイロード部分
 * @param signaturePart 署名部分
 * @returns 無効な形式のJWT文字列
 */
export function createMalformedJwt(
  headerPart: string = 'invalid.header',
  payloadPart: string = 'invalid.payload',
  signaturePart: string = 'invalid.signature',
): string {
  return `${headerPart}.${payloadPart}.${signaturePart}`;
}
