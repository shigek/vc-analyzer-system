export interface CommonResponse<T> {
  payload: T;
  serviceMetadata: {
    serviceName: string;
    version: string; // 例: サービスバージョン
    timestamp: string; // ISO 8601形式の時刻文字列
    processingTimeMillis?: number; // オプション：処理時間
    ipfsGatewayUrl?: string; // オプション：関連するIPFS Gateway URL
    fetchedCid?: string; // オプション：今回取得したCID
    // エラー情報など、必要に応じて追加
    [key: string]: any; // その他のプロパティを許容
  };
}
