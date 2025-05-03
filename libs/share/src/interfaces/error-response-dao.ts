export interface ErrorResponseDao {
  message: string;
  code?: string;
  details?: string;
  correlationId: string;
  statusCode: number;
}
