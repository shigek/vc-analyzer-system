// src/common/middleware/correlation-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks'; // Node.js 組み込みモジュール
import { randomUUID } from 'crypto';

// AsyncLocalStorage のインスタンスをエクスポート
// これを他のサービスから参照してコンテキストを取得します
export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 既存の相関IDヘッダーがあればそれを使用し、なければ新しいUUIDを生成
    const correlationId = req.headers['X-Correlation-ID'] || randomUUID();

    // AsyncLocalStorage のコンテキストを設定
    // .run() メソッドのコールバック内で実行される非同期処理全てで、このストアが利用可能になります
    asyncLocalStorage.run(new Map(), () => {
      // ここでリクエスト開始時刻を格納
      asyncLocalStorage.getStore()!.set('requestStartTime', Date.now());
      // ストアに correlationId を設定
      asyncLocalStorage.getStore()!.set('correlationId', correlationId);

      // レスポンスヘッダーにも相関IDを含める（クライアント側での追跡用）
      res.set('X-Correlation-ID', correlationId as string);

      next();
    });
  }
}
