import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ErrorResponseInterface,
  GeneralErrorDetails,
} from 'lib/share/interfaces/response/error-response.interface'; // 前に定義したErrorResponseをインポート
import { ServiceMetadata } from 'lib/share/interfaces/response/serviceMetadata.interface'; // ServiceMetadataをインポート
import { ConfigService } from '@nestjs/config';
import { ShareService } from 'lib/share';
import { ExternalServiceError } from '../dto/error-response.dto';

@Catch(ExternalServiceError)
export class ExternalServiceExceptinsFilter
  implements ExceptionFilter<ExternalServiceError>
{
  private readonly serviceName: string;
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
  ) {
    const url1 = this.configService.get<string>('DID_RESOLVER_SERVICE_NAME');
    if (!url1) {
      throw new Error(
        'DID_RESOLVER_SERVICE_NAME environment variable is not set.',
      );
    }
    this.serviceName = url1;
  }
  catch(exception: ExternalServiceError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR; // HttpException ではない場合はデフォルトで 500
    // --- ErrorResponse の内容生成 ---
    const errorResponse: ErrorResponseInterface = {
      serviceMetadata: this.generateServiceMetadata(request, status),

      error: {
        code: this.getServiceErrorCode(exception), // 後述のヘルパー関数で決定

        message: this.getErrorMessage(exception), // 後述のヘルパー関数で決定

        details: this.getErrorDetails(exception),
      },
    };
    // エラーログは、ここでまとめて出力しちゃいます。
    response.status(status).json(errorResponse);
  }
  protected generateServiceMetadata(
    request: any,
    _status: number,
  ): ServiceMetadata {
    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    return {
      serviceName: this.serviceName,
      version: this.shareService.getVersion(),
      timestamp: new Date().toISOString(),
      processingTimeMillis,
      correlationId: request.correlationId,
    };
  }
  protected getServiceErrorCode(exception: ExternalServiceError): string {
    const response = exception.getResponse() as object;
    if ('code' in response && typeof response.code === 'string') {
      return response.code;
    }
    return 'GENERIC_HTTP_ERROR';
  }
  protected getErrorMessage(exception: ExternalServiceError): string {
    const response = exception.getResponse() as any;
    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      typeof response.message === 'string'
    ) {
      return response.message;
    }
    if (typeof response === 'string') {
      return response;
    }
    return exception.message || 'An unexpected error occurred.';
  }
  protected getErrorDetails(
    exception: ExternalServiceError,
  ): GeneralErrorDetails[] {
    const response = exception.getResponse() as any;
    if (
      typeof response === 'object' &&
      response !== null &&
      'serviceError' in response &&
      typeof response.serviceError === 'object'
    ) {
      const serviceError = response.serviceError;
      return [{ ...serviceError }];
    }
    return [];
  }
}
