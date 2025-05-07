import vc from '@digitalcredentials/vc';
import { Ed25519Signature2020 } from '@digitalcredentials/ed25519-signature-2020';
import { Ed25519VerificationKey2020 } from '@digitalcredentials/ed25519-verification-key-2020';
import { KeyFileDataLoader } from '../common/key/provider.key';

export async function issue(
  keyFileLoader: KeyFileDataLoader,
  credential: any,
  documentLoader: any,
): Promise<any> {
  try {
    const keyData = keyFileLoader.get(credential.issuer);
    if (!keyData) {
      throw new Error(
        'Error during Trusted List signature verification key not loaded',
      );
    }
    const publicKeyMultibase = credential.issuer.split(':')[2];
    const controller = credential.issuer;
    const keyPair = await Ed25519VerificationKey2020.from({
      type: 'Ed25519VerificationKey2020',
      controller,
      id: `${controller}#${publicKeyMultibase}`,
      publicKeyMultibase,
      // @@@　秘密鍵の取得方法は検討必要
      privateKeyMultibase: keyData.private,
    });
    const suite = new Ed25519Signature2020({
      key: keyPair,
      date: new Date().toISOString(),
    });
    const signedCredential = await vc.issue({
      credential,
      suite,
      documentLoader,
    });
    return signedCredential;
  } catch (error) {
    console.error('Error during Trusted List signature verification:', error);
    return false;
  }
}
