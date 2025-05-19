// 例: src/common/guards/permissions.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // メタデータを読み取るための Reflector

// このGuardで使用するメタデータキーを定義
export const PERMISSIONS_KEY = 'scopes';

// 権限を指定するためのカスタムデコレータを作成
// コントローラーメソッドに @RequiredPermissions('permission:name') のように付与して使用
import { SetMetadata } from '@nestjs/common';
export const RequiredPermissions = (...scopes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, scopes);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(), // または context.getClass() でクラスレベルのメタデータも取得
    );

    // 必要な権限が定義されていない場合は、認可チェックは不要（誰でもアクセス可）
    if (!requiredScopes) {
      return true;
    }

    // リクエストからユーザー情報（JWTペイロード）を取得
    // Gateway JWT 検証後、request.user にペイロードが入っています
    const { user } = context.switchToHttp().getRequest();
    // ユーザー情報またはユーザーの権限リストが存在しない場合は認可失敗 (403 Forbidden)
    if (!user || !user.scopes || !Array.isArray(user.scopes)) {
      throw new ForbiddenException(
        'Permissions denied: User information or permissions not available.',
      );
    }
    // ユーザーが持っている権限（user.permissions）が、エンドポイントが必要とする権限（requiredPermissions）を全て含んでいるかチェック
    const hasRequiredScopes = requiredScopes.every((scope) =>
      user.scopes.includes(scope),
    );

    // 権限が不足している場合は認可失敗 (403 Forbidden)
    if (!hasRequiredScopes) {
      throw new ForbiddenException(
        'Permissions denied: Insufficient permissions.',
      );
    }

    // 権限があれば認可成功
    return true;
  }
}
