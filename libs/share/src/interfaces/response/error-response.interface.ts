import { ServiceMetadata } from './serviceMetadata.interface';
// エラー時の応答ボディ例
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    externalServiceError?: { [key: string]: any };
    details: { [key: string]: any };
  };
  serviceMetadata: ServiceMetadata;
}
export interface ValidationErrorDetails {
  field: string;
  message: string;
}
export interface VerificationErrorDetails {
  status: string;
  message: string;
}
export interface StatusListErrorDetails {
  status: string;
  message: string;
}
export interface RegistrationErrorDetails {
  message: string;
}
