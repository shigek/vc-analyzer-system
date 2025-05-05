export interface ServiceMetadata {
  serviceName: string;
  version: string;
  timestamp: string;
  processingTimeMillis?: number;
  corrilationId?: string;
  ipfsGatewayUrl?: string; // オプション：関連するIPFS Gateway URL
  fetchedCid?: string; // オプション：今回取得したCID
  [index: string]: any;
}
