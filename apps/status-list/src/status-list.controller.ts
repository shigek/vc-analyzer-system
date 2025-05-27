import {
  Controller,
  Param,
  Res,
  Body,
  Post,
  UseFilters,
  ValidationPipe,
  UseGuards,
  Patch,
  Get,
} from '@nestjs/common';
import { StatusListService } from './status-list.service';
import { StatusListCreateDto } from 'lib/share/common/dto/status-list-create.dto';
import { StatusListUpdateDto } from 'lib/share/common/dto/status-list-update.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from 'lib/share/interfaces/response/common-response.interface';
import { AuthGuard } from '@nestjs/passport';
import {
  PermissionsGuard,
  RequiredPermissions,
} from 'lib/share/common/auth/guard/permissions.guard';
import { Permissions } from 'lib/share/common/permissions';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from 'lib/share/common/dto/error-response.dto';
import {
  StatusListResponse,
  StatusListSuccessResponse,
} from './dto/success-response.dto';
import { StatusListExceptinsFilter } from './common/filters/all-exceptions.filter';
import { ShareService } from 'lib/share';
import { ServiceMetadata } from 'lib/share/interfaces/response/serviceMetadata.interface';
import { processTime } from 'lib/share/utils/process-time';

@Controller('status-lists')
@UseFilters(StatusListExceptinsFilter)
@ApiTags('Bitstring Status List')
export class StatusListController {
  private readonly serviceName: string;
  private readonly ipfsGatewayUrl: string;
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
    private readonly statusListService: StatusListService,
  ) {
    const url1 = this.configService.get<string>('STATUSLIST_SERVICE_NAME');
    if (!url1) {
      throw new Error(
        'STATUSLIST_SERVICE_NAME environment variable is not set.',
      );
    }
    this.serviceName = url1;
    const url2 = this.configService.get<string>('IPFS_GATEWAY_URL');
    if (!url2) {
      throw new Error('IPFS_GATEWAY_URL environment variable is not set.');
    }
    this.ipfsGatewayUrl = url2;
  }
  @ApiOperation({
    summary: 'ステータスリストの作成',
    description:
      'このエンドポイントはステータスリストを作成します。入力としてリストのサイズを受け取ります。',
  })
  @ApiResponse({
    status: 200,
    description: 'ステータスリストの作成に成功した。',
    type: StatusListSuccessResponse,
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
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @ApiBearerAuth('gateway-jwt')
  @UseGuards(AuthGuard('gateway-jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.STATUS_LIST_CREATE)
  @Post()
  async hundleCreateList(
    @Res() res: Response,
    @Body(new ValidationPipe()) createDto: StatusListCreateDto,
  ): Promise<any> {
    //1. 登録する
    const { cid, statusListData } =
      await this.statusListService.createExecute(createDto);
    const processingTimeMillis = processTime();
    const payload: StatusListResponse = {
      listId: statusListData.id.replace('urn:', ''),
      message: 'Status List created successfully.',
    };
    const metadata: ServiceMetadata = {
      serviceName: this.serviceName,
      version: this.shareService.getVersion(),
      timestamp: new Date().toISOString(),
      processingTimeMillis,
      verifableCredentialUrl: `${this.ipfsGatewayUrl}/${cid}`,
      createdCid: cid,
    };
    //2.レスポンス成形
    const finalResponse: CommonResponse<typeof payload, typeof metadata> = {
      payload: payload,
      serviceMetadata: metadata,
    };
    //3. 応答を返す
    return res.status(201).send(finalResponse);
  }
  @ApiOperation({
    summary: 'ステータスリストの状態取得',
    description:
      'このエンドポイントはステータスリストの状態を取得します。入力としてlistId, indexを受け取ります。',
  })
  @ApiParam({
    name: 'listId',
    description: 'リストIDを指定する',
    example: 'd8290d62-813d-44a9-98d3-fd27c85f729b',
  })
  @ApiParam({
    name: 'index',
    description: 'indexを指定する',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'ステータスリストの状態取得に成功した',
    type: StatusListSuccessResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'データが存在しない',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: '受け取った、listIdのデータは存在しているが、検証に失敗した。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @Get('/:listId/status/:index')
  async handleStatusCheks(
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Res() res: Response,
  ): Promise<any> {
    // 初期処理
    const internalId = `urn:${listId}`;
    // ステータスリスト状態確認確認
    const { status, bitValue, cid } =
      await this.statusListService.verifyExecute(internalId, index);
    const processingTimeMillis = processTime();
    const payload: StatusListResponse = {
      listId,
      index,
      status,
      bitValue,
      message: 'Status retrieved successfully.',
    };
    const metadata: ServiceMetadata = {
      serviceName: this.serviceName,
      version: this.shareService.getVersion(),
      timestamp: new Date().toISOString(),
      processingTimeMillis,
      verifableCredentialUrl: `${this.ipfsGatewayUrl}/${cid}`,
      fetchedCid: cid,
    };
    const finalResponse: CommonResponse<typeof payload, typeof metadata> = {
      payload: payload,
      serviceMetadata: metadata,
    };
    //4. 応答を返す
    return res.send(finalResponse);
  }
  @ApiBearerAuth('gateway-jwt')
  @ApiOperation({
    summary: 'ステータスの更新',
    description:
      'このエンドポイントはステータスをrevokedに更新します。入力としてlistId,indexを受け取ります。',
  })
  @ApiParam({
    name: 'listId',
    description: 'listIdを指定する',
    example: 'd8290d62-813d-44a9-98d3-fd27c85f729b',
  })
  @ApiParam({
    name: 'index',
    description: 'indexを指定する',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'ステータスの更新に成功した',
    type: StatusListSuccessResponse,
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
    description: '受け取った、listIdのデータは存在しているが、検証に失敗した。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @UseGuards(AuthGuard('gateway-jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.STATUS_LIST_UPDATE)
  @Patch(':listId/status/:index')
  async handleUpdateStatus(
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Res() res: Response,
    @Body(new ValidationPipe()) updateDto: StatusListUpdateDto,
  ): Promise<any> {
    const internalId = `urn:${listId}`;
    const { status, cid, changedValue } =
      await this.statusListService.updateExecute(internalId, index, updateDto);
    const processingTimeMillis = processTime();
    const payload: StatusListResponse = {
      listId,
      index,
      newBitValue: changedValue,
      newStatus: status,
      message: 'Status updated successfully.',
    };
    const metadata: ServiceMetadata = {
      serviceName: this.serviceName,
      version: this.shareService.getVersion(),
      timestamp: new Date().toISOString(),
      processingTimeMillis,
      verifableCredentialUrl: `${this.ipfsGatewayUrl}/${cid}`,
      createdCid: cid,
    };
    //2.レスポンス成形
    const finalResponse: CommonResponse<typeof payload, typeof metadata> = {
      payload: payload,
      serviceMetadata: metadata,
    };

    //6. 応答を返す
    return res.send(finalResponse);
  }
}
