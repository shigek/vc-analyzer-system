import {
  Controller,
  Get,
  Headers,
  Param,
  Res,
  Put,
  Body,
  Post,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import { StatusListService } from './status-list.service';
import { StatusListCreateDto } from './dto/status-list-create.dto';
import { StatusListUpdateDto } from './dto/status-list-update.dto';
import { Response } from 'express';
import { StatusListData } from './interfaces/status-list-data.interface';
import { AllExceptionsFilter } from '@share/share/common/filters/all-exceptions.filter';
import { storage } from '@share/share/common/strage/storage';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '@share/share/interfaces/response/common-response.interface';

@Controller()
@UseFilters(AllExceptionsFilter)
export class StatusListController {
  private readonly ipfsPeerUrl: string;
  private readonly serviceName: string;
  constructor(
    private configService: ConfigService,
    private readonly statusListService: StatusListService,
  ) {
    const url1 = this.configService.get<string>('IPFS_PEER_PUBLIC_URL');
    if (!url1) {
      throw new Error('IPFS_PEER_PUBLIC_URL environment variable is not set.');
    }
    this.ipfsPeerUrl = url1;
    const url2 = this.configService.get<string>('TRUSTED_LIST_SERVICE_NAME');
    if (!url2) {
      throw new Error(
        'TRUSTED_LIST_SERVICE_NAME environment variable is not set.',
      );
    }
    this.serviceName = url2;
  }
  @Get('status-checks/:listId/:index')
  async handleStatusCheks(
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;
    //1.ファイル読み込む
    const { credential, currentStatusListCid } =
      await this.statusListService.readIpfsDataAndNotFoundError(listId);

    //2 署名検証と、listIdのチェック
    await this.statusListService.verifyProofAndId(listId, credential);

    //3 ステータスをチェックする。
    const { status, statusCode } = await this.statusListService.verifyStatus(
      index,
      credential,
    );
    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const responsePayload = {
      statusIssuer: {
        listId,
        index,
      },
      status,
    };
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
        ipfsGatewayUrl: this.ipfsPeerUrl,
        fetchedCid: currentStatusListCid,
      },
    };
    return res.send(finalResponse);
  }

  @Put('status-lists/:listId/entries/:index/status')
  async handleUpdateStatus(
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Res() res: Response,
    @Body(new ValidationPipe()) updateDao: StatusListUpdateDto,
  ): Promise<any> {
    const request = storage.getStore() as any;
    //1.ファイル読み込む
    const { credential } =
      await this.statusListService.readIpfsDataAndNotFoundError(listId);

    //2.署名検証と、listIdのチェック
    await this.statusListService.verifyProofAndId(listId, credential);

    //3.ステータスを更新する
    const statusListData = this.statusListService.changeStatus(
      index,
      updateDao.status,
      credential,
    );
    //4.署名を打つ
    const signedCredential = await this.statusListService.issue(statusListData);

    //5.登録する。
    const { fetchedCid } = await this.statusListService.registration(
      listId,
      signedCredential,
      true,
    );

    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const responsePayload = {
      statusIssuer: {
        listId,
        index,
      },
      status: updateDao.status,
    };
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
        ipfsGatewayUrl: this.ipfsPeerUrl,
        fetchedCid,
      },
    };
    return res.send(finalResponse);
  }
  @Post('status-lists/register')
  async hundleRegistrationStatus(
    @Res() res: Response,
    @Body(new ValidationPipe()) createDao: StatusListCreateDto,
  ): Promise<any> {
    const request = storage.getStore() as any;

    //1.空のStatusListDataを作る
    const statusListData: StatusListData =
      this.statusListService.createStatusList(createDao.credentials);

    //2.署名を打つ
    const signedCredential = await this.statusListService.issue(statusListData);

    //3.登録する
    const { status, fetchedCid } = await this.statusListService.registration(
      statusListData.id,
      signedCredential,
      false,
    );

    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const responsePayload = {
      statusIssuer: {
        listId: statusListData.id,
      },
      status,
    };
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
        ipfsGatewayUrl: this.ipfsPeerUrl,
        fetchedCid,
      },
    };
    return res.status(201).send(finalResponse);
  }
}
