import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShareService } from '@share/share'
import axios from 'axios';

@Injectable()
export class ResolverService {
  private readonly universalResolverUrl: string;
  private readonly universalResolverPath: string;
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
  ) {
    const url0 = this.configService.get<string>("UNIVERSAL_RESOLVER_URL");
    if (!url0) {
      throw new Error('UNIVERSAL_RESOLVER_URL environment variable is not set.');
    }
    this.universalResolverUrl = url0;

    const url1 = this.configService.get<string>("UNIVERSAL_RESOLVER_PATH");
    if (!url1) {
      throw new Error('UNIVERSAL_RESOLVER_PATH environment variable is not set.');
    }
    this.universalResolverPath = url1;
  }
  async getDidDocument(did: string, correlationId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.universalResolverUrl}/${this.universalResolverPath}/${did}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
          }
        }
      )
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(error, "Universal Resolver", correlationId, [did, '']);
    }
  }
}
