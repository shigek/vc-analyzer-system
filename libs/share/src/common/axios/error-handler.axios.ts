import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';

export function getAxionResponse(
  error: any,
  ms: string,
  paths: string[],
  correlationId: string,
): any {
  const path = paths.join('/');
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.code === 'ECONNREFUSED') {
      return new HttpException({
        message: `Internal service is currently unavailable (Failed to connect to ${ms}).`,
        code: `SERVICE_UNAVAILABLE`,
        details: axiosError.message,
        correlationId
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (axiosError.response) {
      if (axiosError.response.status === 404) {
        return new HttpException({
          message: `Not found: ${path}`,
          code: `SERVICE_NOT_FOUND`,
          serviceError: axiosError.response.data,
          correlationId
        }, HttpStatus.NOT_FOUND);
      } else if (
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        return new HttpException(
          {
            message: `${ms} client error`,
            code: `CLIENT_ERROR`,
            serviceError: axiosError.response.data,
            correlationId
          },
          axiosError.response.status,
        );
      } else if (axiosError.response.status >= 500) {
        return new HttpException({
          message: `${ms} internal server error`,
          code: `MICROSERVICE_UNAVAILABLE`,
          serviceError: axiosError.response.data,
          correlationId
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      } else {
        return new HttpException(
          {
            message: `${ms} unexpected HTTP status`,
            code: `UNEXPECTED_HTTP_STATUS`,
            serviceError: axiosError.response.data,
            correlationId
          },
          axiosError.response.status,
        );
      }
    } else if (axiosError.request) {
      return new HttpException({
        message: `Internal service communication error (No response from ${ms}).`,
        code: `SERVICE_UNAVAILABLE`,
        details: axiosError.message,
        correlationId
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      return new HttpException({
        message: `Failed to send request to Internal service (${ms}).`,
        code: `SERVICE_UNAVAILABLE`,
        details: axiosError.message,
        correlationId
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  } else {
    return new HttpException({
      message: `An unexpected error occurred`,
      details: 'prease contact support.',
      code: `UNEXPECTED_ERROR`,
      correlationId
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
