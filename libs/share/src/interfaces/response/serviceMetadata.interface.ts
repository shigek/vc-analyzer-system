export interface ServiceMetadata {
  serviceName: string;
  version: string;
  timestamp: string;
  processingTimeMillis: number;
  corrilationId?: string;
  verifableCredentialUrl?: string; // オプション：関連するIPFS Gateway URL
  fetchedCid?: string; // 検索結果としてのCID
  createdCid?: string; //　作成結果としてのCID
  [index: string]: any;
}
