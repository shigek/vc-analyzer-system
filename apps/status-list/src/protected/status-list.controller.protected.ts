import {
  Controller,
  Param,
  Res,
  Put,
  Body,
  Post,
  UseFilters,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { StatusListService } from '../services/status-list.service';
import { StatusListCreateDto } from '../dto/status-list-create.dto';
import { StatusListUpdateDto } from '../dto/status-list-update.dto';
import { Response } from 'express';
import { StatusListData } from '../interfaces/status-list-data.interface';
import { AllExceptionsFilter } from '@share/share/common/filters/all-exceptions.filter';
import { storage } from '@share/share/common/strage/storage';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '@share/share/interfaces/response/common-response.interface';
import { AuthGuard } from '@nestjs/passport';
import {
  PermissionsGuard,
  RequiredPermissions,
} from '@share/share/common/auth/guard/permissions.guard';
import { Permissions } from '../common/permissions';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../dto/error-response.dto';
import { AddResponse, GetOrPutResponse } from '../dto/success-response.dto';

@Controller()
@UseFilters(AllExceptionsFilter)
@ApiBearerAuth('gateway-jwt')
export class ProtectedStatusListController {
  private readonly ipfsPeerUrl: string;
  private readonly serviceName: string;
  constructor(
    private configService: ConfigService,
    private readonly statusListService: StatusListService,
  ) {
    const url1 = this.configService.get<string>('STATUS_LIST_SERVICE_NAME');
    if (!url1) {
      throw new Error(
        'STATUS_LIST_SERVICE_NAME environment variable is not set.',
      );
    }
    this.serviceName = url1;
    const url2 = this.configService.get<string>('IPFS_PEER_PUBLIC_URL');
    if (!url2) {
      throw new Error('IPFS_PEER_PUBLIC_URL environment variable is not set.');
    }
    this.ipfsPeerUrl = url2;
  }
  @ApiOperation({
    summary: 'Resolver DID',
    description:
      'このエンドポイントはDIDを解決します。入力としてDIDを受け取ります。',
  })
  @ApiResponse({
    status: 200,
    description: 'DIDの解決に成功した',
    type: AddResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 401,
    description: '認証エラー',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 403,
    description: '認証は成功したが、この操作を実行する権限がない',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'データが存在しない',
  })
  @ApiResponse({
    status: 404,
    description: 'データが存在しない',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: 'データの検証に失敗した',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @UseGuards(AuthGuard('gateway-jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.STATUS_LIST_CREATE)
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

  @UseGuards(AuthGuard('gateway-jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.STATUS_LIST_UPDATE)
  @ApiOperation({
    summary: 'Resolver DID',
    description:
      'このエンドポイントはDIDを解決します。入力としてDIDを受け取ります。',
  })
  @ApiParam({
    name: 'listId',
    description: '解決するDIDを指定する',
    example: 'urn:d8290d62-813d-44a9-98d3-fd27c85f729b',
  })
  @ApiParam({
    name: 'index',
    description: '解決するDIDを指定する',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'DIDの解決に成功した',
    type: GetOrPutResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 401,
    description: '認証エラー',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 403,
    description: '認証は成功したが、この操作を実行する権限がない',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'データが存在しない',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: 'データの検証に失敗した',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @Put('status-lists/:listId/entries/:index/status')
  async handleUpdateStatus(
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Res() res: Response,
    @Body(new ValidationPipe()) updateDao: StatusListUpdateDto,
  ): Promise<any> {
    const request = storage.getStore() as any;

    //1.ファイルの存在チェック(存在しなかったら、例外をスロー)
    this.statusListService.isExistsRegistryOrThrow(listId, false);

    //2.ファイル読み込む
    const { credential } = await this.statusListService.readIpfsData(listId);

    //2.署名検証と、listIdのチェック
    await this.statusListService.verifyProofAndId(listId, credential);

    //3.ステータスを更新する
    const statusListData = await this.statusListService.changeStatus(
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
}
