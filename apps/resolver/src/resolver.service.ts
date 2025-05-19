import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from 'lib/share/common/message/common-message';
import { getAxionResponse } from 'lib/httpclient/error/error-handler.axios';

@Injectable()
export class ResolverService {
  private readonly universalResolverUrl: string;
  private readonly universalResolverPath: string;
  private readonly logger = new Logger(ResolverService.name);
  constructor(private configService: ConfigService) {
    const url1 = this.configService.get<string>('UNIVERSAL_RESOLVER_URL');
    if (!url1) {
      throw new Error(
        'UNIVERSAL_RESOLVER_URL environment variable is not set.',
      );
    }
    this.universalResolverUrl = url1;

    const url2 = this.configService.get<string>('UNIVERSAL_RESOLVER_PATH');
    if (!url2) {
      throw new Error(
        'UNIVERSAL_RESOLVER_PATH environment variable is not set.',
      );
    }
    this.universalResolverPath = url2;
  }
  async getDidDocumentFromUniversalResolver(
    did: string,
    accept: string,
  ): Promise<any> {
    try {
      const response = !accept
        ? await axios.get(
            `${this.universalResolverUrl}/${this.universalResolverPath}/${did}`,
            {
              headers: {
                Accept: 'application/json',
              },
            },
          )
        : await axios.get(
            `${this.universalResolverUrl}/${this.universalResolverPath}/${did}`,
            {
              headers: {
                Accept: accept,
              },
            },
          );

      return {
        content: response.headers['content-type'],
        didDocument: response.data,
      };
    } catch (e) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      const error = getAxionResponse(e, 'DID Resolver', [did]);
      throw error;
    }
  }
}
