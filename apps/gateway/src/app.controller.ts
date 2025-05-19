import {
  Controller,
  Get,
  Param,
  Res,
  Headers,
  UseFilters,
  HttpStatus,
  Req,
  UseGuards,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResolverClientService } from './services/client/resolver.client.service';
import { StatusListClientService } from './services/client/status-list.client.service';
import { storage } from 'lib/share/common/strage/storage';
import { ErrorResponse } from 'lib/share/common/dto/error-response.dto';
import * as resolver from 'apps/resolver/src/dto/success-response.dto';
import * as statusList from 'apps/status-list/src/dto/success-response.dto';
import * as trustedList from 'apps/trusted-list/src/dto/success-response.dto';
import { ExternalServiceExceptinsFilter } from 'lib/httpclient/filters/external-exceptions.filter';
import { AppService } from './app.service';
import { TrustedListClientService } from './services/client/trusted-list.client.service';
import { getUserContext } from './utils/user-info';
import { AuthGuard } from '@nestjs/passport';
import {
  PermissionsGuard,
  RequiredPermissions,
} from './auth/guard/permissions.guard';
import { Permissions } from 'lib/share/common/permissions';
import { StatusListCreateDto } from 'apps/status-list/src/dto/status-list-create.dto';
import { StatusListUpdateDto } from 'apps/status-list/src/dto/status-list-update.dto';
import { SubjectDidRegistrationDto } from 'apps/trusted-list/src/dto/subject-did-registration';
import { SubjectDidUpdateDto } from 'apps/trusted-list/src/dto/subject-did-update';
import { AllExceptionsFilter } from 'lib/share/common/filters/all-exceptions.filter';

@Controller('/analyzer-gateway')
@ApiTags('ExternalApiService')
@UseFilters(ExternalServiceExceptinsFilter, AllExceptionsFilter)
export class ExternalApiController {
  constructor(
    private readonly resolverClientService: ResolverClientService,
    private readonly statusListClientService: StatusListClientService,
    private readonly trustedListClientService: TrustedListClientService,
    private readonly appService: AppService,
  ) {}
  @Get()
  haldleHello(@Res() res: Response) {
    return res.send('Hello VC Anarizer');
  }
  @Get('/contexts/trusted-list/v1')
  async handleContextLoader(@Res() res: Response): Promise<any> {
    const { status, data } = await this.appService.getContext();
    if (status === HttpStatus.OK) {
      res.status(status).send(data);
    } else {
      res.status(status).send('JSON-LD Context not found.');
    }
  }
  @ApiOperation({
    summary: 'Resolver Serviceへリクエストを中継する',
    description:
      'このエンドポイントはDIDを解決します。入力としてDIDを受け取ります。',
  })
  @ApiHeader({
    name: 'Accept',
    description: '処理識別子',
    examples: {
      'application/did+json': {
        value: 'applicaiton/json',
        description: 'DIDドキュメントのメディアタイプ（JSON）',
      },
      'application/did+ld+json': {
        value: 'applicaiton/did+ld+json',
        description: 'DIDドキュメントのメディアタイプ（JSON-LD）。',
      },
      'application/ld+json;profile="https://w3id.org/did-resolution"': {
        value: 'application/ld+json;profile="https://w3id.org/did-resolution"',
        description: 'DID解決結果のメディアタイプ (JSON-LD).',
      },
    },
    required: false,
  })
  @ApiParam({
    name: 'did',
    description: '解決するDIDを指定する',
    example: 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
  })
  @ApiResponse({
    content: resolver.ResolverSuccessResponse,
    status: 200,
    description: 'DIDの解決に成功した',
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
    status: 406,
    description: 'サポートされていない表現です。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 410,
    description: '正常に解決されましたが、DIDは無効化されています。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 501,
    description: 'DIDメソッドはサポートされていません',
    type: ErrorResponse,
  })
  @Get('/verifier/resolve/:did')
  async hundleGetDidDocument(
    @Headers('Accept') accept: string,
    @Param('did') did: string,
  ): Promise<any> {
    const request = storage.getStore() as any;
    console.log(request.correlationId);
    const userContext: {
      permission?: string[];
      clientId?: string;
      correlationId: string;
    } = {
      correlationId: request.correlationId,
    };
    return await this.resolverClientService.getDidDocument(
      did,
      accept,
      userContext,
    );
  }
  @ApiOperation({ summary: 'Status listの状態を取得する' })
  @ApiParam({ name: 'listId', description: 'Status list lisの識別子' })
  @ApiParam({
    name: 'index',
    description: 'Status listの状態が設定されている位置情報',
  })
  @ApiResponse({
    status: 200,
    description: 'Status listの状態取得が正常に終了した',
    type: statusList.StatusListSuccessResponse,
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
    description: 'データの検証に失敗した',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @Get('/verifier/status-lists/:listId/status/:index')
  hundleGetStatus(
    @Req() req: Request,
    @Param('listId') listId: string,
    @Param('index') index: number,
  ): any {
    const request = storage.getStore() as any;
    const userContext = getUserContext(req.user);
    return this.statusListClientService.getStatus(listId, index, {
      ...userContext,
      correlationId: request.correlationId,
    });
  }
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiBody({ type: StatusListCreateDto })
  @ApiResponse({
    status: 201,
    description: 'Status listの登録が正常終了した',
    type: statusList.StatusListSuccessResponse,
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
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.STATUS_LIST_MANAGER)
  @Post('/manager/status-lists')
  async handleCreateStatus(@Req() req: Request): Promise<any> {
    const request = storage.getStore() as any;
    const userContext = getUserContext(req.user);
    return this.statusListClientService.createStatus(req.body, {
      ...userContext,
      correlationId: request.correlationId,
    });
  }
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
    type: statusList.StatusListSuccessResponse,
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
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.STATUS_LIST_MANAGER)
  @Patch('/manager/status-lists/:listId/status/:index')
  async handleUpdateStatus(
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Req() req: Request,
  ): Promise<any> {
    const request = storage.getStore() as any;
    const userContext = getUserContext(req.user);
    return this.statusListClientService.updateStatus(listId, index, req.body, {
      ...userContext,
      correlationId: request.correlationId,
    });
  }
  @ApiOperation({ summary: 'Trusted listの状態を取得する' })
  @ApiParam({ name: 'did', description: '発行者のDID' })
  @ApiResponse({
    status: 200,
    description: 'Trusted listの状態取得が正常に終了した',
    type: trustedList.TrustedListSuccessResponse,
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
    description: 'データの検証に失敗した',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @Get('/verifier/trusted-issuers/:did')
  handleGetIssuer(@Req() req: Request, @Param('did') did: string): any {
    const request = storage.getStore() as any;
    const userContext = getUserContext(req.user);
    return this.trustedListClientService.getIssuer(did, {
      ...userContext,
      correlationId: request.correlationId,
    });
  }
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiResponse({
    status: 202,
    description: 'Trusted listの取得が正常終了した',
    type: trustedList.TrustedListSuccessResponse,
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
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.TRUSTED_LIST_ADMIN)
  @Get('/admin/trusted-issuers')
  async handleGetIssuers(@Req() req: Request): Promise<any> {
    const request = storage.getStore() as any;
    const userContext = getUserContext(req.user);
    return this.trustedListClientService.getIssuers({
      ...userContext,
      correlationId: request.correlationId,
    });
  }
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiBody({ type: SubjectDidRegistrationDto })
  @ApiResponse({
    status: 201,
    description: 'Trusted listの登録が正常終了した',
    type: trustedList.TrustedListSuccessResponse,
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
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.TRUSTED_LIST_MANAGER)
  @Post('/manager/trusted-issuers')
  async handleCreateIssuer(@Req() req: Request): Promise<any> {
    const request = storage.getStore() as any;
    const userContext = getUserContext(req.user);
    return this.trustedListClientService.createIssuer(req.body, {
      ...userContext,
      correlationId: request.correlationId,
    });
  }
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
    type: trustedList.TrustedListSuccessResponse,
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
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.TRUSTED_LIST_MANAGER)
  @Patch('/manager/trusted-issuers/:subjectDid')
  async handleUpdateIssuer(
    @Param('subjectDid') subjectDid: string,
    @Req() req: Request,
  ): Promise<any> {
    const request = storage.getStore() as any;
    const userContext = getUserContext(req.user);
    return this.trustedListClientService.updateIssuer(subjectDid, req.body, {
      ...userContext,
      correlationId: request.correlationId,
    });
  }
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiParam({ name: 'subjectDid', description: '処理依頼者のDIDを設定する' })
  @ApiResponse({
    status: 200,
    description: 'Trusted listの削除が正常終了した',
    type: trustedList.TrustedListSuccessResponse,
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
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequiredPermissions(Permissions.TRUSTED_LIST_MANAGER)
  @Delete('/manager/trusted-issuers/:subjectDid')
  async handleDeleteTrustedIssuer(
    @Param('subjectDid') subjectDid: string,
    @Req() req: Request,
  ): Promise<any> {
    const request = storage.getStore() as any;
    const userContext = getUserContext(req.user);
    return this.trustedListClientService.deleteIssuer(subjectDid, {
      ...userContext,
      correlationId: request.correlationId,
    });
  }
}
