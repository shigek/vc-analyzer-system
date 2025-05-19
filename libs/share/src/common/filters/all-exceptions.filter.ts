// src/common/filters/all-exceptions.filter.ts
import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ErrorResponseInterface,
  GeneralErrorDetails,
} from 'lib/share/interfaces/response/error-response.interface'; // 前に定義したErrorResponseをインポート
import { ServiceMetadata } from 'lib/share/interfaces/response/serviceMetadata.interface'; // ServiceMetadataをインポート

@Catch(HttpException)
export class AllExceptionsFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
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
    // @@@ エラーログは、ここでまとめて出力しちゃいます。
    response.status(status).json(errorResponse);
  }

  protected generateServiceMetaData(
    serviceName: string,
    version: string,
    request: any,
  ): ServiceMetadata {
    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    return {
      serviceName: serviceName,
      version: version,
      timestamp: new Date().toISOString(),
      processingTimeMillis,
      correlationId: request.correlationId,
    };
  }

  protected generateServiceMetadata(
    request: any,
    _status: number,
  ): ServiceMetadata {
    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    return {
      serviceName: 'VC Analyzer Service', // 例
      version: '0.0.1', // 例
      timestamp: new Date().toISOString(),
      processingTimeMillis,
      correlationId: request.correlationId,
    };
  }

  protected getServiceErrorCode(exception: HttpException): string {
    // 例外の種類に応じて、サービス独自のエラーコードを決定
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.BAD_REQUEST) {
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'errors' in response &&
        Array.isArray(response.errors)
      ) {
        // ValidationPipe のエラー形式の場合
        return 'VALIDATION_ERROR';
      }
      return 'BAD_REQUEST';
    } else if (status === HttpStatus.NOT_FOUND) {
      return 'NOT_FOUND';
    } else if (status === HttpStatus.UNAUTHORIZED) {
      return 'AUTHENTICATION_FAILED';
    } else if (status === HttpStatus.FORBIDDEN) {
      return 'PERMISSION_DENIED';
    } else if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
      return 'VERIFICATION_INVALID';
    } else if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'INTERNAL_ERROR';
    } else if (status === HttpStatus.NOT_IMPLEMENTED) {
      return 'IMPLEMENTED_ERROR';
    } else if (status === HttpStatus.BAD_GATEWAY) {
      return 'GATEWAY_ERROR';
    }
    return 'GENERIC_HTTP_ERROR';
  }

  protected getErrorMessage(exception: HttpException): string {
    // クライアントに返すエラーメッセージを決定
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const response = exception.getResponse();
    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof response === 'object' &&
      response !== null &&
      'errors' in response &&
      Array.isArray(response.errors)
    ) {
      return 'Input validation failed.'; // 例: 固定メッセージ
    }
    // デフォルトメッセージ
    if (status === HttpStatus.NOT_FOUND) return 'Resource not found.';
    if (status === HttpStatus.UNAUTHORIZED) return 'Authentication required.';
    if (status === HttpStatus.FORBIDDEN)
      return 'Authentication was successful, but there are no operational permissions.';
    if (status === HttpStatus.UNPROCESSABLE_ENTITY)
      return 'Verifable credential data for exists, but verification failed.';
    if (status === HttpStatus.INTERNAL_SERVER_ERROR)
      return 'An unexpected error occurred.';

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

  protected getErrorDetails(exception: HttpException): GeneralErrorDetails[] {
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const response = exception.getResponse();
    if (
      //ValidationPipe
      status === HttpStatus.BAD_REQUEST &&
      typeof response === 'object' &&
      response !== null &&
      'errors' in response &&
      Array.isArray(response.errors)
    ) {
      const validationErrors = exception.getResponse() as any;
      if (Array.isArray(validationErrors.errors)) {
        return validationErrors.errors.map((err: any) => ({
          field: err.property,
          message: Object.values(err.constraints || {}).join(', '),
        }));
      }
    }

    if (
      typeof response === 'object' &&
      response !== null &&
      'generalErrors' in response &&
      Array.isArray(response.generalErrors)
    ) {
      const validationErrors = exception.getResponse() as any;
      if (Array.isArray(validationErrors.generalErrors)) {
        return validationErrors.generalErrors.map((err: any) => ({
          code: err.code,
          field: err.field,
          status: err.status,
          message: err.message,
        }));
      }
    }
    if (
      typeof response === 'object' &&
      response !== null &&
      'generalErrors' in response &&
      typeof response.generalErrors === 'object'
    ) {
      const generalErrorDetails = exception.getResponse() as any;
      const generalErrors = generalErrorDetails.generalErrors;
      return [
        {
          code: generalErrors.code,
          field: generalErrors.field,
          status: generalErrors.status,
          message: generalErrors.message,
        },
      ];
    }
    return [];
  }
}
