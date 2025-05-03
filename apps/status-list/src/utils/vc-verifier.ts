import vc from '@digitalbazaar/vc';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { DocumentLoader } from '@share/share/did/document-loader';

export async function verifyStatusListSignature(
  statusListDocument: any,
  documentLoader: DocumentLoader,
): Promise<boolean> {
  try {
    console.log(`Starting Trusted List signature Verification...`);
    const result = await vc.verifyCredential(statusListDocument, {
      suite: new Ed25519Signature2020(),
      documentLoader,
    });
    console.log(`Signature verification result`, result);
    return result.verified === true;
  } catch (error) {
    console.error('Error during Trusted List signature verification:', error);
    return false;
  }
}
