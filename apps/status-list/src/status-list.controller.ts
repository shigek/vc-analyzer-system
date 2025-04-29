import {
  Controller,
  Get,
  Headers,
  Param,
  Res,
  Put,
  Body,
  Post,
} from '@nestjs/common';
import { StatusListService } from './status-list.service';
import { ShareService, UpdateDao, CreateDao } from '@share/share';
import { Response } from 'express';
import { StatusListData } from './interfaces/status-list-data.interface';

@Controller()
export class StatusListController {
  constructor(
    private shareService: ShareService,
    private readonly statusListService: StatusListService,
  ) {}
  @Get('status-checks/:listId/:index')
  async getStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Res() res: Response,
  ): Promise<any> {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    try {
      const startTime = process.hrtime();
      const statusListData = await this.statusListService.load(
        listId,
        index,
        newCorrelationId,
      );
      const status = await this.statusListService.getStatus(
        statusListData,
        index,
        newCorrelationId,
      );
      const endTime = process.hrtime(startTime);
      res.setHeader('X-Correlation-ID', newCorrelationId);
      const timeTaskMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;
      return res.send({ status, serviceMetadata: { timeTaskMs } });
    } catch (error) {
      throw error;
    }
  }
  @Put('status-lists/:listId/entries/:index/status')
  async putStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Res() res: Response,
    @Body() updateDao: UpdateDao,
  ): Promise<any> {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    try {
      const startTime = process.hrtime();
      const statusListData: StatusListData = await this.statusListService.load(
        listId,
        index,
        newCorrelationId,
      );
      const status = this.statusListService.setStatus(
        statusListData,
        index,
        updateDao.status,
        newCorrelationId,
      );
      await this.statusListService.save(
        listId,
        statusListData,
        newCorrelationId,
      );
      const endTime = process.hrtime(startTime);
      res.setHeader('X-Correlation-ID', newCorrelationId);
      const timeTaskMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;
      return res.send({ status, serviceMetadata: { timeTaskMs } });
    } catch (error) {
      throw error;
    }
  }
  @Post('status-lists/register')
  async postStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Res() res: Response,
    @Body() createDao: CreateDao,
  ): Promise<any> {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    try {
      const startTime = process.hrtime();
      const statusListData: StatusListData =
        await this.statusListService.createNewStatusList(
          createDao.credentials,
          newCorrelationId,
        );

      const signedCredential =
        this.statusListService.generateStatusListData(statusListData, newCorrelationId);
      await this.statusListService.save(
        statusListData.id,
        statusListData,
        newCorrelationId,
      );
      const endTime = process.hrtime(startTime);
      res.setHeader('X-Correlation-ID', newCorrelationId);
      const timeTaskMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;
      return res.status(201).send({
        serviceMetadata: {
          listId: statusListData.id,
          statusPurpose: statusListData.statusPurpose,
          timeTaskMs,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
