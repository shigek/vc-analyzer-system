import vc from '@digitalbazaar/vc';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';

export async function issue(
  issuerDid: string,
  credential: any,
  documentLoader: any,
): Promise<any> {
  try {
    const publicKeyMultibase = issuerDid.split(':')[2];
    const controller = issuerDid;
    const keyPair = await Ed25519VerificationKey2020.from({
      type: 'Ed25519VerificationKey2020',
      controller,
      id: `${controller}#${publicKeyMultibase}`,
      publicKeyMultibase,
      // @@@　秘密鍵の取得方法は検討必要
      privateKeyMultibase:
        'zrv54LN7eKUsSX6qvYxp1AvQweEShTguFfWaLgKbqJPQLV3mum51UaLxz9mhT8SgwrTHQppJarF9f34zCmArqKjwtWQ',
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
