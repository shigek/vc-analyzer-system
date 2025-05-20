// src/common/interceptors/logging.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { asyncLocalStorage } from '../middleware/correlation-id.middleware'; // AsyncLocalStorageインスタンスをインポート
import { CustomLogger } from '../logger/custom-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requestStartTime = asyncLocalStorage
      .getStore()
      ?.get('requestStartTime');

    if (!requestStartTime) {
      // リクエスト開始時刻がAsyncLocalStorageにない場合は、計測せずに次へ
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const methodName = context.getHandler().name; // 実行されるメソッド名
    const controllerName = context.getClass().name; // 実行されるコントローラー名
    const correlationId =
      asyncLocalStorage.getStore()?.get('correlationId') || 'N/A';

    // next.handle() はルートハンドラーの実行を表すObservableを返します
    return next.handle().pipe(
      // tap オペレーターで、Observableが完了した（レスポンスが送られる）際に処理を実行
      tap(() => {}),
      // --- catchError オペレーター ---
      catchError((error) => {
        this.logger.error(
          `Request failed [${correlationId}] ${request.method} ${request.url}`,
          error.stack,
          // `${controllerName}.${methodName}`,
          `${controllerName}`,
        );
        return throwError(() => error);
      }),
      finalize(() => {
        const responseEndTime = Date.now();
        const durationMs = responseEndTime - requestStartTime;
        // ログに出力するために、AsyncLocalStorageに処理時間を格納
        // これでCustomLoggerがログを出力する際に、durationも取得できるようになります
        asyncLocalStorage.getStore()?.set('requestDurationMs', durationMs);
        this.logger.log(
          `Request completed [${correlationId}] ${request.method} ${request.url}`,
          //`${controllerName}.${methodName}`,
          `${controllerName}`,
        );

        // ここで直接ログ出力しても良いですが、CustomLoggerに任せる方が一貫性があります
        // this.logger.log(`Request [${request.method} ${request.url}] handled by ${controllerName}.${methodName} in ${durationMs}ms`);

        // 必要に応じて、レスポンスヘッダーにも処理時間を含めることもできます
        // response.header('X-Response-Time', `${durationMs}ms`);
      }),
    );
  }
}
