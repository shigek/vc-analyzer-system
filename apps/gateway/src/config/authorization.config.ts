// Gateway 側の設定（例: config/authorization.config.ts）

export const clientPermissionsMapping = {
  'trusted-issuer-service': {
    'trusted-list:manage': [
      'trusted-issuer:create',
      'trusted-issuer:update',
      'trusted-issuer:delete',
    ],
  },
  'status-list-service': {
    'status-list:manage': ['status-list:create', 'status-list:update'],
  },
  'another-client': [
    // 別のクライアント
    'trusted-issuer:read-all',
  ],
  // ... 他のクライアントと権限のマッピング ...
};
export function getClientPermissions(
  clientPermissions: string[],
  service: string,
): string[] {
  const clientPermissionsMap = clientPermissionsMapping[service];
  if (!clientPermissionsMap) {
    throw new Error('scoope not set.');
  }

  const permissions = Object.keys(clientPermissionsMap).map(function (key) {
    if (clientPermissions.includes(key)) {
      return clientPermissionsMap[key];
    }
  });
  if (permissions.length === 0) {
    throw new Error('scoope not set.');
  }
  console.log(permissions[0]);
  return permissions[0];
}
