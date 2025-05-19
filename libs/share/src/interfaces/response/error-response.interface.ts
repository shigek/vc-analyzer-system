import { ServiceMetadata } from './serviceMetadata.interface';
export interface ErrorResponseInterface {
  error: {
    code: string;
    message: string;
    details: { [key: string]: any };
  };
  serviceMetadata: ServiceMetadata;
}
export interface GeneralErrorDetails {
  [key: string]: any;
}
