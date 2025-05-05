import { ServiceMetadata } from './serviceMetadata.interface';

export interface CommonResponse<T> {
  payload: T;
  serviceMetadata: ServiceMetadata;
}
