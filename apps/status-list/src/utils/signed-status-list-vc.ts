import { StatusListVerifableCredential } from '../interfaces/status-list-data.interface';
import { securityLoader } from '@digitalcredentials/security-document-loader';
import { issue } from 'lib/share/utils/jsonld-signer';
import { KeyFileDataLoader } from 'lib/share/common/key/provider.key';
export async function signedCredential(
  credential: StatusListVerifableCredential,
  keyfileLoader: KeyFileDataLoader,
  documentLoader: any,
): Promise<StatusListVerifableCredential> {
  const signedCredential: StatusListVerifableCredential = await issue(
    keyfileLoader,
    credential,
    documentLoader,
  );
  return signedCredential;
}

export function setDocumentLoader(): any {
  const loader = securityLoader({ fetchRemoteContexts: true });
  return loader.build();
}
