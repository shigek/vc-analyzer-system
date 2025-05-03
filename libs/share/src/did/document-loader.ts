import { CachedResolver } from '@digitalbazaar/did-io';
import * as key from '@digitalbazaar/did-method-key';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';

export const systemDidResolver: CachedResolver = new CachedResolver();
const didKeyDriver = key.driver();
didKeyDriver.use({
  multibaseMultikeyHeader: 'z6Mk',
  fromMultibase: Ed25519VerificationKey2020.from,
});
systemDidResolver.use(didKeyDriver);

export type DocumentLoader = (
  url: string,
) => Promise<{ contextUrl: string | null; documentUrl: string; document: any }>;

export const systemDocumentLoader: DocumentLoader = async (url: string) => {
  console.log(`[DocumentLoader] Attempting to load document: ${url}`);
  if (url.startsWith('did:')) {
    try {
      const didDocument = await systemDidResolver.get({ url });
      if (didDocument) {
        console.log(`[DocumentLoader] Resolver DID Document for ${url}`);
        return {
          contextUrl: null,
          documentUrl: url,
          document: didDocument,
        };
      } else {
        console.error(`[DocumentLoader] DID resolution failed for ${url}`);
        throw new Error(`DID resolution failed for ${url}`);
      }
    } catch (e: any) {
      console.error(
        `[DocumentLoader] DID resolution throw error for ${url}: ${e}`,
      );
      throw new Error(`DID resolution throw error for ${url}: ${e.message}`);
    }
  }
  console.error(
    `[DocumentLoader] Document loading not supported for URL: ${url}`,
  );
  throw new Error(`Document loading not supported for URL: ${url}`);
};
