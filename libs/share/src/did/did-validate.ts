/**
 * DID 文字列が有効な形式であるか検証する
 * @param didString 検証するDID文字列
 * @returns 有効であれば true、無効であれば false
 */
export function validateDid(
  didString: any,
  allowedMethods?: string[],
): boolean {
  // まずは基本的な型チェック
  if (typeof didString !== 'string') {
    console.warn(`Validation failed: Input is not a string.`, didString);
    return false;
  }

  if (!didString.startsWith('did:')) {
    console.warn(`Validation failed: Does not start with 'did:'.`, didString);
    return false;
  }

  const parts = didString.substring(4).split(':'); // 'did:' の後ろを最初の':'で分割
  if (parts.length < 2 || parts[0].length === 0 || parts[1].length === 0) {
    console.warn(
      `Validation failed: Missing method name or method-specific identifier.`,
      didString,
    );
    return false;
  }

  // オプション: 特定のメソッドだけを許可する場合
  if (allowedMethods && !allowedMethods.includes(parts[0])) {
    console.warn(
      `Validation failed: Unsupported DID method "${parts[0]}".`,
      didString,
    );
    return false;
  }

  //console.log(`Basic DID string "${didString}" seems valid.`);
  return true; // 基本的なチェックを通過
}
