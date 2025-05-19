// src/common/messages/errorMessages.ts

// メッセージに埋め込む値の型を定義すると、より型安全になります（オプション）
export interface ResourceArgs {
  resourceType: string; // 見つからなかったリソースの種類 (例: 'Trusted Issuer')
  identifier: string; // そのリソースの識別子 (例: DID)
}

export interface ValidationDetailArgs {
  field: string; // バリデーションに失敗したフィールド名
  reason: string; // 失敗理由
}

export const SERVICE_NAME = {
  STATUS_LIST_SERVICE: 'status-list-service',
  TRUSTED_LIST_SERVICE: 'trusted-issuer-service',
  RESOLVER_LIST_SERVICE: 'resolver-service',
};

export const STATUS_CODE = {
  REVOKE: 'revoked',
  VALID: 'valid',
  UNKNOWN: 'unknown',
};

export const TRUSTED_CODE = {
  TRUSTED: 'trusted',
  NOT_TRUSTED: 'not-trusted',
  UNKNOWN: 'unknown',
};

// エラーメッセージを管理するオブジェクト（値を引数にとる関数を含む）
export const CODE_MESSAGES = {
  VC_VERIFICATIN_FIELD: 'VC_VERIFICATION_FAILED',
  STATUS_CHECK_FIELD: 'STATUS_CHECK_FIELD',
};

export const RESOURCE_TYPE = {
  TRUSTED_ISSUER: 'Trusted issuer',
  STATUS_LIST: 'Status list',
};

export const ERROR_MESSAGES = {
  UPLOAD_ERROR: (args: ResourceArgs) =>
    `${args.resourceType} not found with identifier: ${args.identifier}.`,

  DOWNLOAD_ERROR: (args: ResourceArgs) =>
    `${args.resourceType} not found with identifier: ${args.identifier}.`,

  // 例: リソースが見つからなかった場合のメッセージ関数
  RESOURCE_NOT_FOUND: (args: ResourceArgs) =>
    `${args.resourceType} not found with identifier: ${args.identifier}.`,

  // 例: リソースが存在した場合場合のメッセージ関数
  RESOURCE_ALREDY_EXISTS: (args: ResourceArgs) =>
    `${args.resourceType} alredy exixts with identifier: ${args.identifier}.`,

  // 例: バリデーションエラーの詳細メッセージ関数
  VALIDATION_FAILED_DETAIL: (args: ValidationDetailArgs) =>
    `Field '${args.field}' validation failed: ${args.reason}.`,

  // 例: VC検証失敗だが、より詳細な原因を埋め込みたい場合
  // VC_VERIFICATION_FAILED_DETAIL: (reason: string) => `Verifiable Credential verification failed: ${reason}.`,

  // 値を埋め込まないシンプルなメッセージも、統一のために関数として定義しても良い
  // VALIDATION_ERROR: () => 'Input validation failed.',
  // INTERNAL_ERROR: () => 'An internal server error occurred.',

  VALIDATION_DID_ERROR: 'Invalid subject DID format in URL.',
  INVALID_ISSUER_STATUS: 'not-trusted',
  VALID_ISSUER_STATUS: 'trusted',

  STATUS_REVOKE: 'revoke',
  STATUS_VALID: 'valid',

  UNKNOWN: 'unknown',

  // あるいは、シンプルメッセージは文字列のままでも良い
  VALIDATION_ERROR: 'Input validation failed.',
  INTERNAL_ERROR: 'An internal server error occurred. prease contact support.',

  // 外部APIコールで発生したエラー
  EXTERNAL_API_CALL_FAILD: 'Integration with the external API has failed.',
  // ... 他のメッセージ ...
};

export const ENVIRONMENT_MESSAGES = {
  // 例: リソースが見つからなかった場合のメッセージ関数
  RESOURCE_NOT_FOUND: (args: string) =>
    `${args} environment variable is not set..`,
};
