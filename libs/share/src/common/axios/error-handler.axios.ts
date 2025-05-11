import { HttpException, HttpStatus } from '@nestjs/common';
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
      return new HttpException(
        {
          message: `Internal service is currently unavailable.`,
          code: `SERVICE_CONNECTION_REFUSED`,
          details: [{ message: `Failed to connect to ${ms}` }],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    // 応答があった場合
    if (axiosError.response) {
      if (axiosError.response.status === 404) {
        return new HttpException(
          {
            message: `Not found: ${path}`,
            code: `SERVICE_DATA_NOT_FOUND`,
            serviceError: axiosError.response.data,
          },
          HttpStatus.NOT_FOUND,
        );
      } else if (
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        return new HttpException(
          {
            message: `${ms} client error`,
            code: `SERVICE_CLIENT_ERROR`,
            serviceError: axiosError.response.data,
          },
          axiosError.response.status,
        );
      } else if (axiosError.response.status >= 500) {
        if (axiosError.response.status == 501) {
          return new HttpException(
            {
              message: `${ms} not implemented server error`,
              code: `SERVICE_NOT_IMPLEMENTED`,
              serviceError: axiosError.response.data,
            },
            axiosError.response.status,
          );
        }
        return new HttpException(
          {
            message: `${ms} internal server error`,
            code: `SERVICE_UNAVAILABLE`,
            serviceError: axiosError.response.data,
          },
          axiosError.response.status,
        );
      } else {
        return new HttpException(
          {
            message: `${ms} unexpected HTTP status`,
            code: `SERVICE_UNEXPECTED_HTTP_STATUS`,
            serviceError: axiosError.response.data,
            correlationId,
          },
          axiosError.response.status,
        );
      }
      //リクエストは正常、応答なし
    } else if (axiosError.request) {
      return new HttpException(
        {
          message: `Internal service communication error.`,
          code: `SERVICE_NO_RESPONSE`,
          details: [{ message: `No response from ${ms}` }],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      //その他
    } else {
      return new HttpException(
        {
          message: `Failed to send request to Internal service error.`,
          code: `GATEWAY_UNAVAILABLE`,
          details: [{ message: `${ms}` }],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  } else {
    return new HttpException(
      {
        message: `An unexpected error occurred`,
        details: [{ message: 'prease contact support.' }],
        code: `GATEWAY_UNEXPECTED_ERROR`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
