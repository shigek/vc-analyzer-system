import { HttpStatus, Injectable } from '@nestjs/common';
import path from 'path';
import { promises as fs } from 'fs';

const CONTEXT_FILE_PATH = path.join(
  __dirname,
  '../../..',
  'contexts',
  'trusted-list-v1.jsonld',
);

@Injectable()
export class AppService {
  getHello(): any {
    return 'Hello VC Anarizer';
  }
  /**
   * Status List Service から特定のステータスを取得する
   *
   * @param listId
   * @param index
   * @param userContext
   * @returns 取得したステータス情報
   */
  async getContext(): Promise<any> {
    return fs
      .readFile(CONTEXT_FILE_PATH, 'utf8')
      .then((data) => {
        console.log(
          `Successfully read context file. Serving with Content-Type: application/ld+json`,
        );
        return { status: HttpStatus.OK, data };
      })
      .catch((err) => {
        console.error(
          `Error reading context file "${CONTEXT_FILE_PATH}":`,
          err,
        );
        return { status: HttpStatus.NOT_FOUND };
      });
  }
}
