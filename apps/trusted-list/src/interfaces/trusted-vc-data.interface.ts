export interface TrustedIssuerEntry {
  validUntil: string; // ISO 8601 形式の文字列を想定
  // 将来追加されるであろう他のクレームもここに追加
  policy?: any;
}

// トラステッドリストデータ全体の型定義 (validationのため)
export interface TrustedListVerifableCredential {
  // VC関連のフィールド
  '@context'?: string | string[];
  type?: string | string[];
  issuer: string;
  issued?: string;
  credentialSubject: CredentialSubject;
  proof: any; // Proof 構造 (具体的な型はProof Suiteによる)
}
export interface CredentialSubject {
  id?: string; // credentialSubject の ID
  validFrom?: string; // 承認が取れた日
  trustedIssuerEntry: TrustedIssuerEntry; // エントリの配列
  // 将来追加されるであろう他のクレームもここに追加
}
