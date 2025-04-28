import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShareService } from '@share/share'
import axios from 'axios';

@Injectable()
export class MicroserviceRequesterService {
  private readonly didResolverUrl: string;
  private readonly statusListUrl: string;
  private readonly trustedListUrl: string;
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
  ) {
    const url0 = this.configService.get<string>("DID_RESOLVER_URL");
    if (!url0) {
      throw new Error('DID_RESOLVER_URL environment variable is not set.');
    }
    this.didResolverUrl = url0;

    const url1 = this.configService.get<string>("STATUS_LIST_URL");
    if (!url1) {
      throw new Error('STATUS_LIST_URL environment variable is not set.');
    }
    this.statusListUrl = url1;

    const url2 = this.configService.get<string>("TRUSTED_LIST_URL");
    if (!url2) {
      throw new Error('TRUSTED_LIST_URL environment variable is not set.');
    }
    this.trustedListUrl = url2;
  }
  async getDidDocument(did: string, correlationId: string): Promise<any> {
    const newCorrelationId = (correlationId) ? correlationId : this.shareService.generateUUID();
    try {
      const response = await axios.get(`${this.didResolverUrl}/resolve/${did}`,
        {
          headers: {
            'X-Correlation-ID': newCorrelationId,
            'Content-Type': 'application/json',
          }
        }
      )
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(error, "DID Resolver", newCorrelationId, [did, '']);
    }
  }
  async getStatus(listId: string, index: number, correlationId: string): Promise<any> {
    const newCorrelationId = (correlationId) ? correlationId : this.shareService.generateUUID();
    try {
      const response = await axios.get(`${this.statusListUrl}/status-checks/${listId}/${index}`,
        {
          headers: {
            'X-Correlation-ID': newCorrelationId,
            'Content-Type': 'application/json',
          }
        }
      )
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(error, "Status List", newCorrelationId, [listId, `${index}`]);
    }
  }
  async isTrustedIssuer(did: string, correlationId: string): Promise<any> {
    const newCorrelationId = (correlationId) ? correlationId : this.shareService.generateUUID();
    try {
      const response = await axios.get(`${this.trustedListUrl}/trusted-issuers/${did}`,
        {
          headers: {
            'X-Correlation-ID': newCorrelationId,
            'Content-Type': 'application/json',
          }
        }
      )
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(error, "Trusted List", newCorrelationId, [did, ``]);
    }
  }
}
