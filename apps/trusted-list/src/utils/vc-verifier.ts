import vc from '@digitalbazaar/vc';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { securityLoader } from '@digitalbazaar/security-document-loader';
const documentLoader = securityLoader().build();
export async function verifyTrustedListSignature(
  credential: any,
): Promise<boolean> {
  try {
    console.log(`Starting Trusted List signature Verification...`);
    const suite = new Ed25519Signature2020();
    const result = await vc.verifyCredential({
      credential,
      suite,
      documentLoader,
    });
    console.log(`Signature verification result`, result);
    return result.verified === true;
  } catch (error) {
    console.error('Error during Trusted List signature verification:', error);
    return false;
  }
}
