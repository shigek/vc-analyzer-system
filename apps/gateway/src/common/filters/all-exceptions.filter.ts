// src/common/filters/all-exceptions.filter.ts
import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '@share/share/interfaces/response/error-response.interface'; // 前に定義したErrorResponseをインポート
import { ServiceMetadata } from '@share/share/interfaces/response/serviceMetadata.interface'; // ServiceMetadataをインポート

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
    const errorResponse: ErrorResponse = {
      serviceMetadata: this.generateServiceMetadata(request, status),

      error: {
        code: this.getServiceErrorCode(exception), // 後述のヘルパー関数で決定

        message: this.getErrorMessage(exception), // 後述のヘルパー関数で決定

        externalServiceError: this.getServiceErrorDetail(exception),

        details: this.getErrorDetails(exception),
      },
    };
    // エラーログは、ここでまとめて出力しちゃいます。
    response.status(status).json(errorResponse);
  }
  getServiceErrorDetail(exception: HttpException) {
    const response = exception.getResponse();
    if (
      typeof response === 'object' &&
      response !== null &&
      'serviceError' in response &&
      response.serviceError
    ) {
      return response;
    }
    return {};
  }
  private generateServiceMetadata(
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

  private getServiceErrorCode(exception: HttpException): string {
    const response = exception.getResponse() as object;
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status === HttpStatus.UNAUTHORIZED) {
      return 'UNAUTHORIZED';
    }
    if ('code' in response && typeof response.code === 'string') {
      return response.code;
    }
    return 'GENERIC_HTTP_ERROR';
  }

  private getErrorMessage(exception: HttpException): string {
    // クライアントに返すエラーメッセージを決定
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const response = exception.getResponse();

    // ValidationPipe のエラーの場合、メッセージは response.message に配列として含まれることが多い
    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof response === 'object' &&
      response !== null &&
      'errors' in response &&
      Array.isArray(response.errors)
    ) {
      return 'Input validation failed.'; // 例: 固定メッセージ
    }

    // HttpException の response にメッセージが含まれている場合
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

    // デフォルトメッセージ
    if (status === HttpStatus.NOT_FOUND) return 'Resource not found.';
    if (status === HttpStatus.UNAUTHORIZED) return 'Authentication required.';
    if (status === HttpStatus.FORBIDDEN) return 'Access forbidden.';
    if (status === HttpStatus.UNPROCESSABLE_ENTITY)
      return 'VC verification faild';
    if (status === HttpStatus.INTERNAL_SERVER_ERROR)
      return 'An internal server error occurred.';

    return exception.message || 'An unexpected error occurred.';
  }

  private getErrorDetails(exception: HttpException): { [key: string]: any } {
    const response = exception.getResponse() as object;
    if ('details' in response && Array.isArray(response.details)) {
      return response.details;
    }
    return [];
  }
}
