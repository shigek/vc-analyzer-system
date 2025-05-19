import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import path from 'path';

@Injectable()
export class ShareService implements OnModuleInit {
  private readonly logger = new Logger(ShareService.name);
  private appVersion: string;
  onModuleInit() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      // package.jsonファイルを同期的に読み込む
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');

      // JSONとしてパース
      const packageJson = JSON.parse(packageJsonContent);

      // versionプロパティを取得
      this.appVersion = packageJson.version;

      this.logger.log(`Application version loaded: ${this.appVersion}`);
    } catch (error) {
      this.logger.error(
        'Failed to load application version from package.json',
        error.stack,
      );
      this.appVersion = 'N/A'; // エラー時はデフォルト値を設定
    }
  }
  getVersion(): string {
    return this.appVersion;
  }
}
