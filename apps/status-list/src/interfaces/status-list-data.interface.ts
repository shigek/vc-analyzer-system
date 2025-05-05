import { Buffer } from 'buffer';

export interface StatusListData {
  id: string;

  statusPurpose: string;

  bitstring: Buffer;

  bitLength: number;

  byteLength: number;

  lastUpdateAt?: Date;
}

// トラステッドリストデータ全体の型定義 (validationのため)
export interface StatusListVerifableCredential {
  // VC関連のフィールド
  '@context'?: string | string[];
  id: string;
  type?: string | string[];
  issuer: string;
  issued?: string;
  credentialSubject: CredentialSubject;
  proof: any; // Proof 構造 (具体的な型はProof Suiteによる)
}
export interface CredentialSubject {
  id: string;
  type: string;
  statusPurpose: string;
  encodedList: string;
}
