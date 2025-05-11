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
  UseFilters,
} from '@nestjs/common';
import { TrustedListsRequesterService } from '../services/manager/trusted-list/trusted-list-requester.service';
import { StatusListsRequesterService } from '../services/manager/status-list/status-list-requester.service';
import { randomUUID } from 'crypto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import {
  fileLoader,
  KeyFileDataLoader,
} from '@share/share/common/key/provider.key';
import { ConfigService } from '@nestjs/config';
import { signToken } from '@share/share/common/jwt/jsonwebtoken';
import { getClientPermissions } from '../config/authorization.config';
import { SERVICE_NAME } from '@share/share/common/message/common-message';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from '../dto/error-response.dto';
import { StatusListCreateDto } from 'apps/status-list/src/dto/status-list-create.dto';
import { StatusListUpdateDto } from 'apps/status-list/src/dto/status-list-update.dto';
import { SubjectDidRegistrationDto } from 'apps/trusted-list/src/dto/subject-did-registration';
import { SubjectDidUpdateDto } from 'apps/trusted-list/src/dto/subject-did-update';
import { SubjectDidDeleteDto } from 'apps/trusted-list/src/dto/subject-did-delete';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { storage } from '@share/share/common/strage/storage';
import {
  AddResponse,
  GetOrPutResponse,
} from 'apps/status-list/src/dto/success-response.dto';
import {
  AddOrPutResponse,
  DeleteResponse,
} from 'apps/trusted-list/src/dto/success-response.dto';

@ApiBearerAuth('jwt')
@ApiTags('manager')
@Controller('manager')
@UseFilters(AllExceptionsFilter)
export class PrivateAnalyzerController {
  private readonly logger = new Logger(PrivateAnalyzerController.name);
  private readonly keyFileLoader: KeyFileDataLoader;
  private readonly key: string;
  private readonly kid: string;
  private readonly gatewayServiceName: string;
  constructor(
    private configService: ConfigService,
    private readonly trustedListRequesterService: TrustedListsRequesterService,
    private readonly statusListRequesterService: StatusListsRequesterService,
  ) {
    const url1 = this.configService.get<string>('GATEWAY_KEY_DATA');
    if (!url1) {
      throw new Error('GATEWAY_KEY_DATA environment variable is not set.');
    }
    const url2 = this.configService.get<string>('GATEWAY_KEY');
    if (!url2) {
      throw new Error('GATEWAY_KEY environment variable is not set.');
    }
    this.kid = url2;
    const url3 = this.configService.get<string>('GATEWAY_SERVICE_NAME');
    if (!url3) {
      throw new Error('GATEWAY_SERVICE_NAME environment variable is not set.');
    }
    this.gatewayServiceName = url3;

    const { loader, key } = fileLoader(url1);
    this.key = key;
    this.keyFileLoader = loader;
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiBody({ type: StatusListCreateDto })
  @ApiResponse({
    status: 201,
    description: 'Status listの登録が正常終了した',
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
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: 'VCデータの検証に失敗した',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @Post('status-lists/register')
  async handleAddStatusList(@Req() req: Request): Promise<any> {
    const request = storage.getStore() as any;
    // JWT-TOKENを作成する。
    const user = req.user as { clientId: string; scopes: string[] };
    const permissions = getClientPermissions(
      user?.scopes,
      SERVICE_NAME.STATUS_LIST_SERVICE,
    ); //['status-list:create'];
    const aud = [SERVICE_NAME.STATUS_LIST_SERVICE];
    const keyData = this.keyFileLoader.get(this.key);
    if (!keyData) {
      throw new Error('key is not found');
    }
    const accessToken = await signToken(
      keyData,
      { sub: user.clientId, iss: this.gatewayServiceName, aud, permissions },
      { kid: this.kid },
      { expiresIn: '5m' },
    );
    return this.statusListRequesterService.addStatusList(
      req.body,
      '', //accessToken,
      request.correlationId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiParam({ name: 'listId', description: 'Status list lisの識別子' })
  @ApiParam({
    name: 'index',
    description: 'Status listの状態が設定されている位置情報',
    example: 20,
  })
  @ApiBody({ type: StatusListUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Status listの状態更新が正常終了した',
    type: GetOrPutResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ErrorResponse,
  })
  @ApiResponse({ status: 401, description: '認証エラー', type: ErrorResponse })
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
  async handleUpdateStatusListStatus(
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Req() req: Request,
  ): Promise<any> {
    const request = storage.getStore() as any;
    // JWT-TOKENを作成する。
    const keyData = this.keyFileLoader.get(this.key);
    if (!keyData) {
      throw new Error('key is not found');
    }
    const user = req.user as { clientId: string; scopes: string[] };
    const permissions = getClientPermissions(
      user?.scopes,
      SERVICE_NAME.STATUS_LIST_SERVICE,
    ); //['status-list:update'];
    const aud = [SERVICE_NAME.STATUS_LIST_SERVICE];
    const accessToken = await signToken(
      keyData,
      { sub: user.clientId, iss: this.gatewayServiceName, aud, permissions },
      { kid: this.kid },
      { expiresIn: '5m' },
    );
    return this.statusListRequesterService.updateStatusList(
      listId,
      index,
      req.body,
      accessToken,
      request.correlationId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiBody({ type: SubjectDidRegistrationDto })
  @ApiResponse({
    status: 201,
    description: 'Trusted listの登録が正常終了した',
    type: AddOrPutResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ErrorResponse,
  })
  @ApiResponse({ status: 401, description: '認証エラー', type: ErrorResponse })
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
  @Post('trusted-issuers')
  async handleAddTrustedIssuer(@Req() req: Request): Promise<any> {
    const request = storage.getStore() as any;
    const keyData = this.keyFileLoader.get(this.key);
    if (!keyData) {
      throw new Error('key is not found');
    }

    const user = req.user as { clientId: string; scopes: string[] };
    const permissions = getClientPermissions(
      user?.scopes,
      SERVICE_NAME.TRUSTED_LIST_SERVICE,
    ); //['trusted-list:crate'];
    const aud = [SERVICE_NAME.TRUSTED_LIST_SERVICE];
    const accessToken = await signToken(
      keyData,
      { sub: user.clientId, iss: this.gatewayServiceName, aud, permissions },
      { kid: this.kid },
      { expiresIn: '5m' },
    );
    return this.trustedListRequesterService.addTrustedList(
      req.body,
      accessToken,
      request.correlationId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiBody({ type: SubjectDidUpdateDto })
  @ApiParam({ name: 'subjectDid', description: '処理依頼者のDIDを設定する' })
  @ApiResponse({
    status: 200,
    description: 'Trusted listの更新が正常終了した',
    type: AddOrPutResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ErrorResponse,
  })
  @ApiResponse({ status: 401, description: '認証エラー', type: ErrorResponse })
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
  @Put('trusted-issuers/:subjectDid')
  async handleUpdateTrustedIssuer(
    @Param('subjectDid') subjectDid: string,
    @Req() req: Request,
  ): Promise<any> {
    const request = storage.getStore() as any;
    const keyData = this.keyFileLoader.get(this.key);
    if (!keyData) {
      throw new Error('key is not found');
    }
    const user = req.user as { clientId: string; scopes: string[] };
    const permissions = getClientPermissions(
      user?.scopes,
      SERVICE_NAME.TRUSTED_LIST_SERVICE,
    ); //['trusted-list:update'];
    const aud = [SERVICE_NAME.TRUSTED_LIST_SERVICE];
    const accessToken = await signToken(
      keyData,
      { sub: user.clientId, iss: this.gatewayServiceName, aud, permissions },
      { kid: this.kid },
      { expiresIn: '5m' },
    );
    return this.trustedListRequesterService.updateTrustedList(
      subjectDid,
      req.body,
      accessToken,
      request.correlationId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiBody({ type: SubjectDidDeleteDto })
  @ApiParam({ name: 'subjectDid', description: '処理依頼者のDIDを設定する' })
  @ApiResponse({
    status: 200,
    description: 'Trusted listの削除が正常終了した',
    type: DeleteResponse,
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
  @Delete('trusted-issuers')
  async handleDeleteTrustedIssuer(@Req() req: Request): Promise<any> {
    const request = storage.getStore() as any;
    const keyData = this.keyFileLoader.get(this.key);
    if (!keyData) {
      throw new Error('key is not found');
    }
    const user = req.user as { clientId: string; scopes: string[] };
    const permissions = getClientPermissions(
      user?.scopes,
      SERVICE_NAME.TRUSTED_LIST_SERVICE,
    ); //['trusted-list:delete'];
    const aud = [SERVICE_NAME.TRUSTED_LIST_SERVICE];
    const accessToken = await signToken(
      keyData,
      { sub: user.clientId, iss: this.gatewayServiceName, aud, permissions },
      { kid: this.kid },
      { expiresIn: '5m' },
    );
    return this.trustedListRequesterService.deleteTrustedList(
      req.body,
      accessToken,
      request.correlationId,
    );
  }
}
