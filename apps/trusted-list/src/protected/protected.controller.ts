import {
  Controller,
  Put,
  Post,
  Param,
  Res,
  Body,
  Delete,
  UseFilters,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { TrustedListService } from '../services/trusted-list.service';
import { Response } from 'express';
import { CommonResponse } from '@share/share/interfaces/response/common-response.interface';
import { ConfigService } from '@nestjs/config';
import { SubjectDidUpdateDto } from '../dto/subject-did-update';
import { AllExceptionsFilter } from '@share/share/common/filters/all-exceptions.filter';
import { SubjectDidRegistrationDto } from '../dto/subject-did-registration';
import { SubjectDidDeleteDto } from '../dto/subject-did-delete';
import { storage } from '@share/share/common/strage/storage';
import { CredentialSubject } from '../interfaces/trusted-vc-data.interface';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  AddOrPutResponse,
  DeleteResponse,
  GetResponse,
} from '../dto/success-response.dto';
import { ErrorResponse } from '../dto/error-response.dto';

@Controller('trusted-issuers')
@UseFilters(AllExceptionsFilter)
@ApiBearerAuth('gateway-jwt')
export class ProtectedController {
  private readonly ipfsPeerUrl: string;
  private readonly serviceName: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly trustedListService: TrustedListService,
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

  @ApiOperation({
    summary: 'Resolver DID',
    description:
      'このエンドポイントはDIDを解決します。入力としてDIDを受け取ります。',
  })
  @ApiResponse({
    status: 200,
    description: 'DIDの解決に成功した',
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
  @UseGuards(AuthGuard('gateway-jwt'))
  @Post()
  async hundlePostTrustedIssuers(
    @Body(new ValidationPipe())
    subjectDidRegistrationDto: SubjectDidRegistrationDto,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;
    const subjectDid = subjectDidRegistrationDto.subjectDid;

    //1.ファイルの存在チェック（存在したら、例外がスローされる)
    this.trustedListService.isExistsRegistryOrThrow(subjectDid, true);

    //2.署名を打つ
    const signedCredential = await this.trustedListService.issue({
      subjectDid,
    });

    //3.登録する
    const { fetchedCid } = await this.trustedListService.registration(
      subjectDid,
      signedCredential,
      false,
    );

    const responsePayload = {
      trustedIssuer: subjectDid,
    };
    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
        ipfsGatewayUrl: this.ipfsPeerUrl,
        fetchedCid: fetchedCid,
      },
    };
    return res.status(201).send(finalResponse);
  }

  @ApiOperation({
    summary: 'Resolver DID',
    description:
      'このエンドポイントはDIDを解決します。入力としてDIDを受け取ります。',
  })
  @ApiParam({
    name: 'subjectDid',
    description: '解決するDIDを指定する',
    example: 'urn:d8290d62-813d-44a9-98d3-fd27c85f729b',
  })
  @ApiResponse({
    status: 200,
    description: 'DIDの解決に成功した',
    type: AddOrPutResponse,
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
  @UseGuards(AuthGuard('gateway-jwt'))
  @Put(':subjectDid')
  async hundlePutTrustedIssuers(
    @Param('subjectDid') subjectDid: string,
    @Body(new ValidationPipe()) updateDto: SubjectDidUpdateDto,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;
    //1.validUntilのバリデート
    this.trustedListService.validateValidUnit(updateDto.validUntil);

    //2.ファイルの存在チェック（存在しなかったら、例外がスローされる)
    this.trustedListService.isExistsRegistryOrThrow(subjectDid, false);

    //3.ファイル読み込む
    const { credential } =
      await this.trustedListService.readIpfsData(subjectDid);

    //4.署名検証と、subjectDidのチェック
    await this.trustedListService.verifyProofAndId(subjectDid, credential);

    //5. credentialSubjectを変更する
    const credentialSubject = credential.credentialSubject as CredentialSubject;
    if (updateDto.validUntil) {
      credentialSubject.trustedIssuerEntry.validUntil = updateDto.validUntil;
    }
    if (updateDto.policy) {
      credentialSubject.trustedIssuerEntry.policy = updateDto.policy;
    }
    credential.credentialSubject.trustedIssuerEntry =
      credentialSubject.trustedIssuerEntry;
    delete credential.proof; // proofは新規になるのでいったん削除
    //6.署名を打つ
    const signedCredential = await this.trustedListService.issue({
      credential,
      subjectDid,
    });

    //5.登録する
    const { fetchedCid } = await this.trustedListService.registration(
      subjectDid,
      signedCredential,
      true,
    );

    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const responsePayload = {
      trustedIssuer: subjectDid,
    };
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
        ipfsGatewayUrl: this.ipfsPeerUrl,
        fetchedCid: fetchedCid,
      },
    };
    return res.send(finalResponse);
  }

  @ApiOperation({
    summary: 'Resolver DID',
    description:
      'このエンドポイントはDIDを解決します。入力としてDIDを受け取ります。',
  })
  @ApiParam({
    name: 'subjectDid',
    description: '解決するDIDを指定する',
    example: 'urn:d8290d62-813d-44a9-98d3-fd27c85f729b',
  })
  @ApiResponse({
    status: 200,
    description: 'DIDの解決に成功した',
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
  @UseGuards(AuthGuard('gateway-jwt'))
  @Delete()
  async hundleDeleteTrustedIssuers(
    @Body(new ValidationPipe()) deleteDto: SubjectDidDeleteDto,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;

    //2.ファイルの存在チェック（存在しなかったら、例外がスローされる)
    this.trustedListService.isExistsRegistryOrThrow(
      deleteDto.subjectDid,
      false,
    );

    //3.管理情報を削除
    const { subjectDid } = await this.trustedListService.deleteRegistry(
      deleteDto.subjectDid,
    );

    const responsePayload = {
      trustedIssuer: subjectDid,
    };
    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
      },
    };
    return res.send(finalResponse);
  }
}
