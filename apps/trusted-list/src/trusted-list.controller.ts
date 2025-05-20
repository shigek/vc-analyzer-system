import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseFilters,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { TrustedListService } from './trusted-list.service';
import { Response } from 'express';
import { CommonResponse } from 'lib/share/interfaces/response/common-response.interface';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  TrustedIssuerResponse,
  TrustedListSuccessResponse,
} from './dto/success-response.dto';
import { ErrorResponse } from 'lib/share/common/dto/error-response.dto';
import { TrustedListExceptinsFilter } from './common/filters/all-exceptions.filter';
import { ShareService } from 'lib/share';
import { RequiredPermissions } from 'lib/share/common/auth/guard/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from 'lib/share/common/permissions';
import { SubjectDidRegistrationDto } from './dto/subject-did-registration';
import { SubjectDidUpdateDto } from './dto/subject-did-update';
import { ServiceMetadata } from 'lib/share/interfaces/response/serviceMetadata.interface';
import { processTime } from 'lib/share/utils/process-time';

@Controller('trusted-issuers')
@UseFilters(TrustedListExceptinsFilter)
@ApiTags('APIs that do not require authentication')
export class TrustedListController {
  private readonly ipfsGatewayUrl: string;
  private readonly serviceName: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly shareService: ShareService,
    private readonly trustedListService: TrustedListService,
  ) {
    const url1 = this.configService.get<string>('TRUSTEDLIST_SERVICE_NAME');
    if (!url1) {
      throw new Error(
        'TRUSTEDLIST_SERVICE_NAME environment variable is not set.',
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
    summary: 'Resolver DID',
    description:
      'このエンドポイントは、発行者を登録します。入力としてDIDを受け取ります。',
  })
  @ApiResponse({
    status: 200,
    description: '発行者に登録に成功した',
    type: TrustedListSuccessResponse,
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
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @ApiBearerAuth('gateway-jwt')
  @RequiredPermissions(Permissions.TRUSTED_ISSUER_CREATE)
  @UseGuards(AuthGuard('gateway-jwt'))
  @Post()
  async hundleCreateIssuer(
    @Body(new ValidationPipe()) createDto: SubjectDidRegistrationDto,
    @Res() res: Response,
  ): Promise<any> {
    const { subjectDid } = createDto;
    //1. 登録する
    const { cid } = await this.trustedListService.createExecute(createDto);

    const processingTimeMillis = processTime();
    const payload: TrustedIssuerResponse = {
      trustedIssuer: subjectDid,
      message: 'Trusted List created successfully.',
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
    summary: '発行者の情報を更新する。',
    description:
      'このエンドポイントはDIDを解決します。入力としてDID、有効期限（オプション）を受け取ります。',
  })
  @ApiParam({
    name: 'subjectDid',
    description: '発行者のDIDを指定する',
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  @ApiResponse({
    status: 200,
    description: '発行者の情報Dの更新に成功した',
    type: TrustedListSuccessResponse,
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
    description:
      '受け取った、subjectDidのデータは存在しているが、proofの検証に失敗した。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @ApiBearerAuth('gateway-jwt')
  @UseGuards(AuthGuard('gateway-jwt'))
  @RequiredPermissions(Permissions.TRUSTED_ISSUER_UPDATE)
  @Patch(':subjectDid')
  async hundleUpdateIssuer(
    @Param('subjectDid') subjectDid: string,
    @Res() res: Response,
    @Body(new ValidationPipe()) updateDto: SubjectDidUpdateDto,
  ): Promise<any> {
    //1.更新する
    const { validUntil, cid } = await this.trustedListService.updateExecute(
      subjectDid,
      updateDto,
    );
    const processingTimeMillis = processTime();
    const payload: TrustedIssuerResponse = {
      trustedIssuer: subjectDid,
      validUntil,
      message: 'Trusted issuer updated successfully.',
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

    // //1.validUntilのバリデート
    // this.trustedListService.validateValidUnit(updateDto.validUntil);

    // //2.ファイル読み込む
    // const { credential } = await this.trustedListService.read(subjectDid);

    // //4.署名検証と、subjectDidのチェック
    // await this.trustedListService.verifyProofAndId(subjectDid, credential);

    // //5. credentialSubjectを変更する
    // const credentialSubject = credential.credentialSubject as CredentialSubject;
    // if (updateDto.validUntil) {
    //   credentialSubject.trustedIssuerEntry.validUntil = updateDto.validUntil;
    // }
    // if (updateDto.policy) {
    //   credentialSubject.trustedIssuerEntry.policy = updateDto.policy;
    // }
    // credential.credentialSubject.trustedIssuerEntry =
    //   credentialSubject.trustedIssuerEntry;
    // delete credential.proof; // proofは新規になるのでいったん削除
    // //6.署名を打つ
    // const signedCredential = await this.trustedListService.issue({
    //   credential,
    //   subjectDid,
    // });

    // //7.更新する
    // const { fetchedCid } = await this.trustedListService.update(
    //   subjectDid,
    //   signedCredential,
    // );

    // const endTime = process.hrtime(request.startTime);
    // const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    // const responsePayload = {
    //   trustedIssuer: subjectDid,
    // };
    // const finalResponse: CommonResponse<typeof responsePayload> = {
    //   payload: responsePayload,
    //   serviceMetadata: {
    //     serviceName: this.serviceName,
    //     version: this.shareService.getVersion(),
    //     timestamp: new Date().toISOString(),
    //     processingTimeMillis,
    //     ipfsGatewayUrl: this.ipfsGatewayUrl,
    //     fetchedCid: fetchedCid,
    //   },
    // };
    // //8.応答を返す
    // return res.send(finalResponse);
  }

  @ApiOperation({
    summary: '発行者の削除',
    description:
      'このエンドポイントは登録済みの発行者を削除します。入力としてDIDを受け取ります。',
  })
  @ApiParam({
    name: 'subjectDid',
    description: '削除するDIDを指定する',
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  @ApiResponse({
    status: 200,
    description: '発行者の削除に成功した',
    type: TrustedListSuccessResponse,
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
  @RequiredPermissions(Permissions.TRUSTED_ISSUER_DELETE)
  @UseGuards(AuthGuard('gateway-jwt'))
  @Delete(':subjectDid')
  async hundleDeleteIssuer(
    @Param('subjectDid') subjectDid: string,
    @Res() res: Response,
  ): Promise<any> {
    //1.管理情報を削除する
    await this.trustedListService.deleteExecute(subjectDid);

    const processingTimeMillis = processTime();
    const payload: TrustedIssuerResponse = {
      deletedTrustedIssuer: subjectDid,
      message: 'Trusted issuer delete successfully.',
    };
    const metadata: ServiceMetadata = {
      serviceName: this.serviceName,
      version: this.shareService.getVersion(),
      timestamp: new Date().toISOString(),
      processingTimeMillis,
    };
    //2.レスポンス成形
    const finalResponse: CommonResponse<typeof payload, typeof metadata> = {
      payload: payload,
      serviceMetadata: metadata,
    };
    //3. 応答を返す
    return res.send(finalResponse);
  }

  @ApiOperation({
    summary: 'VC発行者の検証',
    description:
      'このエンドポイントはVC発行者を検証します。入力としてDIDを受け取ります。',
  })
  @ApiParam({
    name: 'subjectDid',
    description: '検証するDIDを指定する',
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  @ApiResponse({
    status: 200,
    description: 'VC発行者の検証に成功した。',
    type: TrustedListSuccessResponse,
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
    description:
      '受け取った、scjectDidのデータは存在しているが、検証に失敗した。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @Get(':subjectDid')
  async hundleGetIssuer(
    @Param('subjectDid') subjectDid: string,
    @Res() res: Response,
  ): Promise<any> {
    //1.状態を確認する
    const { status, cid } =
      await this.trustedListService.verifyExecute(subjectDid);

    const processingTimeMillis = processTime();
    const payload: TrustedIssuerResponse = {
      trustedIssuer: subjectDid,
      status,
      message: 'Trusted issuer delete successfully.',
    };
    const metadata: ServiceMetadata = {
      serviceName: this.serviceName,
      version: this.shareService.getVersion(),
      timestamp: new Date().toISOString(),
      processingTimeMillis,
      verifableCredentialUrl: `${this.ipfsGatewayUrl}/${cid}`,
      fetchedCid: cid,
    };
    //2.レスポンス成形
    const finalResponse: CommonResponse<typeof payload, typeof metadata> = {
      payload: payload,
      serviceMetadata: metadata,
    };
    //3. 応答を返す
    return res.send(finalResponse);

    // //1.ファイル読み込む
    // const { credential, currentTrustedListCid } =
    //   await this.trustedListService.read(subjectDid);

    // //2.署名検証と、subjectDidのチェック
    // await this.trustedListService.verifyProofAndId(subjectDid, credential);

    // //3.credentialSubjectの検証
    // const { validUntil, status } =
    //   await this.trustedListService.verifyCredentialSubject(credential);

    // const endTime = process.hrtime(request.startTime);
    // const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    // const responsePayload = {
    //   trustedIssuer: subjectDid,
    //   status: status,
    //   validUntil: validUntil,
    // };
    // const finalResponse: CommonResponse<typeof responsePayload> = {
    //   payload: responsePayload,
    //   serviceMetadata: {
    //     serviceName: this.serviceName,
    //     version: this.shareService.getVersion(),
    //     timestamp: new Date().toISOString(),
    //     processingTimeMillis,
    //     ipfsGatewayUrl: this.ipfsGatewayUrl,
    //     fetchedCid: currentTrustedListCid,
    //   },
    // };
  }
  @ApiOperation({
    summary: 'VC発行者の検証',
    description: 'このエンドポイントはVC発行者情報をリストで返します。',
  })
  @ApiResponse({
    status: 200,
    description: 'リストの取得に成功した',
    type: TrustedListSuccessResponse,
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
    description:
      '受け取った、scjectDidのデータは存在しているが、proofの検証に失敗した。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @RequiredPermissions(Permissions.TRUSTED_ISSUER_READ_ALL)
  @UseGuards(AuthGuard('gateway-jwt'))
  @ApiBearerAuth('gateway-jwt')
  @Get()
  async hundleGetIssuers(@Res() res: Response): Promise<any> {
    //1.リストを取得する
    const payload = this.trustedListService.listQueryExecute();
    const processingTimeMillis = processTime();
    const metadata: ServiceMetadata = {
      serviceName: this.serviceName,
      version: this.shareService.getVersion(),
      timestamp: new Date().toISOString(),
      processingTimeMillis,
    };
    //2.レスポンス成形
    const finalResponse: CommonResponse<typeof payload, typeof metadata> = {
      payload: payload,
      serviceMetadata: metadata,
    };
    //3. 応答を返す
    return res.send(finalResponse);
  }
}
