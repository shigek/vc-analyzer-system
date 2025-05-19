export function getUserContext(req: any) {
  const user = req as { clientId: string; scopes: string[] };
  const userContext: {
    scopes: string[];
    clientId: string;
  } = {
    scopes: user?.scopes || [],
    clientId: user?.clientId || '',
  };
  return userContext;
}
