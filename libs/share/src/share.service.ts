import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ErrorResponseDao } from './interfaces/error-response-dao';

@Injectable()
export class ShareService {
  private errorResponseDao: ErrorResponseDao = {
    message: '',
    code: '',
    correlationId: '',
    statusCode: 0,
  };

  errorResponse(
    error: any,
    ms: string,
    correlationId: string,
    path: string[],
  ): any {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED') {
        return new InternalServerErrorException({
          ...this.errorResponseDao,
          message: `Internal service is currently unavailable (Failed to connect to ${ms}).`,
          code: `SERVICE_UNAVAILABLE`,
          details: axiosError.message,
          statusCode: 500,
          correlationId,
        });
      }
      if (axiosError.response) {
        if (axiosError.response.status === 404) {
          return new NotFoundException({
            ...this.errorResponseDao,
            message: `Not found: ${path[0]} ${path[1]}`,
            serviceError: axiosError.response.data,
            statusCode: axiosError.response.status,
            correlationId,
          });
        } else if (
          axiosError.response.status >= 400 &&
          axiosError.response.status < 500
        ) {
          return new HttpException(
            {
              message: `${ms} client error`,
              statusCode: axiosError.response.status,
              serviceError: axiosError.response.data,
              correlationId,
            },
            axiosError.response.status,
          );
        } else if (axiosError.response.status >= 500) {
          return new InternalServerErrorException({
            message: `${ms} internal server error`,
            statusCode: axiosError.response.status,
            serviceError: axiosError.response.data,
            correlationId,
          });
        } else {
          return new HttpException(
            {
              message: `${ms} unexpected HTTP status`,
              statusCode: axiosError.response.status,
              serviceError: axiosError.response.data,
              correlationId,
            },
            axiosError.response.status,
          );
        }
      } else if (axiosError.request) {
        return new InternalServerErrorException({
          message: `Internal service communication error (No response from ${ms}).`,
          details: axiosError.message,
          correlationId,
          statusCode: 500,
        });
      } else {
        return new InternalServerErrorException({
          message: `Failed to send request to Internal service (${ms}).`,
          details: axiosError.message,
          correlationId,
          statusCode: 500,
        });
      }
    } else {
      return new InternalServerErrorException({
        message: `An unexpected error occurred`,
        details: 'prease contact support.',
        correlationId,
        statusCode: 500,
      });
    }
  }
  generateUUID(): string {
    return uuidv4();
  }
}
