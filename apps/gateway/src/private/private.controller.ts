import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Put,
  Logger,
} from '@nestjs/common';
import { IssuersRequesterService } from '../services/issuer/issuers-requester.service';
import { ShareService } from '@share/share';

@Controller('issuers')
export class PrivateAnalyzerController {
  private readonly logger = new Logger(PrivateAnalyzerController.name);
  constructor(
    private readonly issuersRequesterService: IssuersRequesterService,
    private shareService: ShareService,
  ) {}

  @Post('status-lists/register')
  postStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Body() createDao: any,
  ): any {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    return this.issuersRequesterService.createStatusList(
      createDao,
      newCorrelationId,
    );
  }

  @Put('status-lists/:listId/entries/:index/status')
  async putStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Body() updateDao: any,
  ): Promise<any> {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    return this.issuersRequesterService.updateStatus(
      listId,
      index,
      updateDao,
      newCorrelationId,
    );
  }
}
