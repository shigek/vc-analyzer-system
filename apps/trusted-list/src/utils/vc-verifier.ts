import vc from '@digitalbazaar/vc';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
export async function verifyTrustedListSignature(
  credential: any,
  documentLoader: any,
): Promise<boolean> {
  try {
    const suite = new Ed25519Signature2020();
    const result = await vc.verifyCredential({
      credential,
      suite,
      documentLoader,
    });
    if (!result.verified) {
      console.error(
        'Error during Trusted List signature verification:',
        result,
      );
    }
    return result.verified === true;
  } catch (error) {
    console.error('Error during Trusted List signature verification:', error);
    return false;
  }
}
