import {
  Controller,
  Headers,
  Param,
  Post,
  Put,
  Logger,
  UseGuards,
  Delete,
  Req,
} from '@nestjs/common';
import { TrustedListsRequesterService } from '../services/manager/trusted-list/trusted-list-requester.service';
import { StatusListsRequesterService } from '../services/manager/status-list/status-list-requester.service';
import { randomUUID } from 'crypto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('manager')
export class PrivateAnalyzerController {
  private readonly logger = new Logger(PrivateAnalyzerController.name);
  constructor(
    private readonly trustedListRequesterService: TrustedListsRequesterService,
    private readonly statusListRequesterService: StatusListsRequesterService,
  ) {}

  //@UseGuards(JwtAuthGuard)
  @UseGuards(AuthGuard('jwt'))
  @Post('status-lists/register')
  async handleAddStatusList(
    @Headers('X-Correlation-ID') correlationId: string,
    @Req() req: Request,
  ): Promise<any> {
    const newCorrelationId = correlationId ? correlationId : randomUUID();
    return this.statusListRequesterService.addStatusList(
      req.body,
      newCorrelationId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('status-lists/:listId/entries/:index/status')
  async handleUpdateStatusListStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Req() req: Request,
  ): Promise<any> {
    const newCorrelationId = correlationId ? correlationId : randomUUID();
    return this.statusListRequesterService.updateStatusList(
      listId,
      index,
      req.body,
      newCorrelationId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('trusted-issuers')
  async handleAddTrustedIssuer(
    @Headers('X-Correlation-ID') correlationId: string,
    @Req() req: Request,
  ): Promise<any> {
    const newCorrelationId = correlationId ? correlationId : randomUUID();
    return this.trustedListRequesterService.addTrustedList(
      req.body,
      newCorrelationId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('trusted-issuers/:subjectDid')
  async handleUpdateTrustedIssuer(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('subjectDid') subjectDid: string,
    @Req() req: Request,
  ): Promise<any> {
    const newCorrelationId = correlationId ? correlationId : randomUUID();
    return this.trustedListRequesterService.updateTrustedList(
      subjectDid,
      req.body,
      newCorrelationId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('trusted-issuers/:subjectDid')
  async handleDeleteTrustedIssuer(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('subjectDid') subjectDid: string,
    @Req() req: Request,
  ): Promise<any> {
    const newCorrelationId = correlationId ? correlationId : randomUUID();
    return this.trustedListRequesterService.deleteTrustedList(
      subjectDid,
      req.body,
      newCorrelationId,
    );
  }
}
