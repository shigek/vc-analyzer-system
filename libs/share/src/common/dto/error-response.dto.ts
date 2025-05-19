import { ApiProperty } from '@nestjs/swagger';
import { ErrorResponseInterface } from 'lib/share/interfaces/response/error-response.interface';
import { ServiceMetadata } from 'lib/share/interfaces/response/serviceMetadata.interface';

class ErrorServiceMetadata implements ServiceMetadata {
  @ApiProperty({ description: 'サービス名' })
  serviceName: string;
  @ApiProperty({ description: 'サービスバージョン' })
  version: string;
  @ApiProperty({ description: '応答時間' })
  timestamp: string;
  @ApiProperty({ description: '処理時間' })
  processingTimeMillis: number;
  @ApiProperty({ description: '処理識別子' })
  correlationId: string;
}
class ErrorMainResponse {
  @ApiProperty({ description: 'エラーコード' })
  code: string;
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラー詳細', isArray: true })
  details: object;
}
export class ErrorResponse implements ErrorResponseInterface {
  @ApiProperty({ description: 'サービスメタ情報' })
  serviceMetadata: ErrorServiceMetadata;
  @ApiProperty({ description: 'エラー情報' })
  error: ErrorMainResponse;
}

export class PersistenceServiceError extends Error {
  private readonly response: { [index: string]: any };
  private readonly status: number;
  readonly message: string;
  constructor(message: { [index: string]: any } | undefined, status: number) {
    super(' Persistence Service Exception');
    this.name = 'PersistenceServiceError';
    this.response = message || {};
    this.status = status;

    // V8 captureStackTrace (Node.js)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, PersistenceServiceError);
    }
  }
  getResponse() {
    return this.response;
  }
  getStatus() {
    return this.status;
  }
}

export class ExternalServiceError extends Error {
  private readonly originalError?: Error; // 元のAxiosエラーなどを格納するプロパティ
  private readonly response: { [index: string]: any };
  private readonly status: number;
  constructor(
    message: { [index: string]: any },
    status: number,
    originalError?: Error,
  ) {
    super('External Service Error');
    this.name = 'ExternalServiceError';
    this.originalError = originalError;
    this.response = message || {};
    this.status = status;

    // V8 captureStackTrace (Node.js)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ExternalServiceError);
    }
  }
  getOriginalError() {
    this.originalError;
  }
  getResponse() {
    return this.response;
  }
  getStatus() {
    return this.status;
  }
}
