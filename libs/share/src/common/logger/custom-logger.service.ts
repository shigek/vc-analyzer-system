// src/common/logger/custom-logger.service.ts
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { asyncLocalStorage } from '../middleware/correlation-id.middleware'; // AsyncLocalStorageインスタンスをインポート

// REQUEST スコープに設定することで、ロガーがリクエストごとにインスタンス化され、
// そのリクエストのコンテキストをより確実に扱えます。
@Injectable()
export class CustomLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const customColors = {
      correlationId: 'yellow', // correlationId を黄色にする
      context: 'yellow', // context をシアンにする
      duration: 'yellow', // 処理時間をマゼンタにする
      // 'error-message': 'redBG' // 特定のエラーメッセージを赤背景にする例
    };
    winston.addColors(customColors);
    this.logger = winston.createLogger({
      // ログレベル (通常は環境変数で設定)
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

      // フォーマット設定
      format: winston.format.combine(
        // timestamp と correlationId をログ情報に追加するカスタムフォーマット
        winston.format((info) => {
          const store = asyncLocalStorage.getStore();
          // AsyncLocalStorage のストアから correlationId を取得
          if (store) {
            if (store.has('correlationId')) {
              info.correlationId = store.get('correlationId');
            }
            if (store.has('requestDurationMs')) {
              info.requestDurationMs = store.get('requestDurationMs');
            }
          }
          // Request スコープのロガーの場合、Constructor はリクエストごとに呼ばれるが、
          // それ以外のコンテキスト（例えばアプリ起動時のログ）では store は存在しない可能性があるため、
          // その場合でもエラーにならないようにチェック
          return info;
        })(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // タイムスタンプのフォーマット
        winston.format.json(), // JSON形式でログ出力（ログ収集ツールに最適）
      ),
      // 出力先 (Transports)
      transports: [
        // コンソール出力
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ colors: customColors, all: true }),
            winston.format.printf(
              // 人間が読みやすい形式で出力
              ({
                level,
                message,
                timestamp,
                correlationId,
                requestDurationMs,
                context,
                ...metadata
              }) => {
                const colorizer = winston.format.colorize();
                const correlationIdPart = correlationId
                  ? `[${correlationId}] `
                  : '';
                const durationPart =
                  requestDurationMs !== undefined
                    ? ` +${colorizer.colorize('duration', `${requestDurationMs}ms`)} `
                    : ''; // 処理時間表示
                const contextPart = context
                  ? `[${colorizer.colorize('context', context as any)}] `
                  : '';
                // メタデータを展開して文字列にする
                const metadataString =
                  Object.keys(metadata).length > 0
                    ? JSON.stringify(metadata)
                    : '';
                return `${timestamp} ${level}: ${correlationIdPart}${contextPart}${message}${durationPart} ${metadataString}`;
              },
            ),
          ),
        }),
        // ファイル出力 (プロダクション環境など)
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  // LoggerService インターフェースのメソッドを実装
  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug?(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  trace(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose?(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
