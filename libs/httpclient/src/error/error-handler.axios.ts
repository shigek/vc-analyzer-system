import { HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ExternalServiceError } from '../dto/error-response.dto';

export function getAxionResponse(error: any, ms: string, paths: string[]): any {
  const path = paths.join('/');
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.code === 'ECONNREFUSED') {
      // 接続できなかった
      return new ExternalServiceError(
        {
          message: `External service is currently unavailable.`,
          code: `SERVICE_COMUNITATION_ERROR`,
          serviceError: { message: `Host refused the service. ${ms}` },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    } else if (axiosError.code === 'ENOTFOUND') {
      return new ExternalServiceError(
        {
          message: `External service is currently unavailable.`,
          code: `SERVICE_COMUNITATION_ERROR`,
          serviceError: { message: `Connection cannot be established. ${ms}` },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
        error,
      );
    } else if (axiosError.code === 'ETIMEDOUT ') {
      return new ExternalServiceError(
        {
          message: `External service is currently unavailable.`,
          code: `SERVICE_COMUNITATION_ERROR`,
          serviceError: {
            message: `Connection could not be established at the specified time. ${ms}`,
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
        error,
      );
    }
    // 応答があった場合
    if (axiosError.response) {
      // レスポンスの結果がエラーだった。
      if (axiosError.response.status === HttpStatus.NOT_FOUND) {
        return new ExternalServiceError(
          {
            code: `SERVICE_DATA_NOT_FOUND`,
            message: `Not found: ${path}`,
            serviceError: axiosError.response.data,
          },
          HttpStatus.NOT_FOUND,
          error,
        );
      } else if (
        // 404以外の4xx
        axiosError.response.status >= HttpStatus.BAD_REQUEST &&
        axiosError.response.status < HttpStatus.INTERNAL_SERVER_ERROR
      ) {
        return new ExternalServiceError(
          {
            code: `SERVICE_REQUEST_CLIENT_ERROR`,
            message: `${ms} service request client error`,
            serviceError: axiosError.response.data,
          },
          axiosError.response.status,
          error,
        );
      } else if (
        axiosError.response.status >= HttpStatus.INTERNAL_SERVER_ERROR
      ) {
        // 500以上
        if (axiosError.response.status == HttpStatus.NOT_IMPLEMENTED) {
          // 501
          return new ExternalServiceError(
            {
              code: `SERVICE_NOT_IMPLEMENTED`,
              message: `${ms} not implemented server error`,
              serviceError: axiosError.response.data,
            },
            axiosError.response.status,
            error,
          );
        }
        // 501以外の5xx
        return new ExternalServiceError(
          {
            code: `SERVICE_UNAVAILABLE`,
            message: `${ms} external server error`,
            serviceError: axiosError.response.data,
          },
          HttpStatus.BAD_GATEWAY,
          error,
        );
      } else {
        return new ExternalServiceError(
          {
            code: `SERVICE_UNEXPECTED_HTTP_STATUS`,
            message: `${ms} unexpected HTTP status`,
            serviceError: axiosError.response.data,
          },
          axiosError.response.status,
          error,
        );
      }
      //リクエストは正常、応答なし
    } else if (axiosError.request) {
      return new ExternalServiceError(
        {
          code: `SERVICE_NO_RESPONSE`,
          message: `Internal service communication error.`,
          details: [{ message: `No response from ${ms}` }],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
      //その他
    } else {
      return new ExternalServiceError(
        {
          code: `GATEWAY_SERVICE_SERVICE_UNAVAILABLE`,
          message: `Failed to send request to Internal service error.`,
          serviceError: { message: `${ms}` },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  } else {
    return new ExternalServiceError(
      {
        code: `GATEWAY_SERVICE_UNEXPECTED_ERROR`,
        message: `An unexpected error occurred`,
        serviceError: { message: 'prease contact support.' },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
      error,
    );
  }
}
