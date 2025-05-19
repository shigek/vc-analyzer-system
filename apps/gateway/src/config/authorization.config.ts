export const clientPermissionsMapping = {
  'vc-analyzer-management-client': {
    'trusted-list:manage': ['trusted-list:manage'],
    'status-list:manage': ['status-list:manage'],
  },
  'vc-analyzer-admin-client': {
    'trusted-list:admin': ['trusted-list:admin'],
  },
  'trusted-issuer-service': ['trusted-list:admin', 'trusted-list:manage'],
  'trusted-list:manage': [
    'trusted-issuer:create',
    'trusted-issuer:update',
    'trusted-issuer:delete',
  ],
  'trusted-list:admin': ['trusted-issuer:read-all'],
  'status-list-service': ['status-list:manage'],
  'status-list:manage': ['status-list:create', 'status-list:update'],
};
export function getClientPermissions(
  requiredScopes: string[],
  clientId: string,
): string[] {
  console.log(clientId);
  const clientPermissions = clientPermissionsMapping[clientId];
  const hasRequiredScopes = requiredScopes.filter((scope) =>
    clientPermissions.includes(scope),
  );
  if (hasRequiredScopes.length === 0) {
    throw new Error(`scoope not set. ${clientId}`);
  }
  let permissions = [];
  for (const key of hasRequiredScopes) {
    if (clientPermissionsMapping[key]) {
      permissions = permissions.concat(clientPermissionsMapping[key]);
    }
  }
  return permissions;
}
