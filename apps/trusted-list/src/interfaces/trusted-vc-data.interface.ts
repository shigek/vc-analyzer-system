export interface TrustedIssuerEntry {
  trustedIssuerDid: string;
  validUntil: string; // ISO 8601 形式の文字列を想定
  // 将来追加されるであろう他のクレームもここに追加
  // policy?: any;
}

// トラステッドリストデータ全体の型定義 (validationのため)
export interface TrustedListDocument {
  // VC関連のフィールド
  '@context'?: string | string[];
  type?: string | string[];
  issuer: string;
  issued?: string;
  credentialSubject: {
    id?: string; // credentialSubject の ID
    trustedIssuerEntries: TrustedIssuerEntry[]; // エントリの配列
    // 将来追加されるであろう他のクレームもここに追加
  };
  proof: any; // Proof 構造 (具体的な型はProof Suiteによる)
}
