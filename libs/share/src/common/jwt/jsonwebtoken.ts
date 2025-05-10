import jose from 'jose';
import { KeyData } from '../key/provider.key';

// Sign the JWT
export async function signToken(
  keyData: KeyData,
  payload: { [index: string]: any },
  headerOptions = {},
  jwtOptions: { expiresIn: string },
) {
  const privateKey = await jose.importPKCS8(keyData.private, keyData.type);
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ ...headerOptions, alg: keyData.type })
    .setIssuedAt()
    .setExpirationTime(jwtOptions.expiresIn)
    .sign(privateKey);
  return jwt;
}
