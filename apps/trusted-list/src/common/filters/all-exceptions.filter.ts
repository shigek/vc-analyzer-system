import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseInterface } from 'lib/share/interfaces/response/error-response.interface'; // 前に定義したErrorResponseをインポート
import { ServiceMetadata } from 'lib/share/interfaces/response/serviceMetadata.interface'; // ServiceMetadataをインポート
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from 'lib/share/common/filters/all-exceptions.filter';
import { ShareService } from 'lib/share';

@Catch(HttpException)
export class TrustedListExceptinsFilter
  extends AllExceptionsFilter
  implements ExceptionFilter<HttpException>
{
  private readonly serviceName: string;
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
  ) {
    super();
    const url1 = this.configService.get<string>('TRUSTEDLIST_SERVICE_NAME');
    if (!url1) {
      throw new Error(
        'TRUSTEDLIST_SERVICE_NAME environment variable is not set.',
      );
    }
    this.serviceName = url1;
  }
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

        message: super.getErrorMessage(exception), // 後述のヘルパー関数で決定

        details: super.getErrorDetails(exception),
      },
    };
    // エラーログは、ここでまとめて出力しちゃいます。
    response.status(status).json(errorResponse);
  }

  protected generateServiceMetadata(
    request: any,
    _status: number,
  ): ServiceMetadata {
    return super.generateServiceMetaData(
      this.serviceName,
      this.shareService.getVersion(),
      request,
    );
  }
  protected getServiceErrorCode(exception: HttpException): string {
    const response = exception.getResponse() as object;
    if ('code' in response && typeof response.code === 'string') {
      return response.code;
    }
    return super.getServiceErrorCode(exception);
  }
}
