import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import * as jose from 'jose';
import { Issuer } from 'openid-client';
import { HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { createTestJwtWithKid } from '../../test/utils/jwt.helper';
import { KeyFileDataLoader } from 'lib/share/common/key/provider.key';
jest.mock('jose', () => ({
  // joseがエクスポートしている関数を、それぞれjest.fn()でモックします。
  // 必要に応じて具体的な実装や戻り値を定義します。
  importJWK: jest.fn(),
  exportSPKI: jest.fn(),
  importSPKI: jest.fn(),
  jwtVerify: jest.fn(),
  jwtSign: jest.fn(),
  // もしjoseがクラスをエクスポートしている場合も同様
  // SomeClass: jest.fn().mockImplementation(() => ({
  //   someMethod: jest.fn(),
  // })),
}));
const mockedJose = jose as jest.Mocked<typeof jose>;
jest.mock('axios', () => ({
  get: jest.fn(),
  isAxiosError: jest.fn((error: any) => error && error.isAxiosError),
}));
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedIsAxiosError = axios.isAxiosError as unknown as jest.Mock;
const mockKeyLoader = KeyFileDataLoader as jest.Mocked<
  typeof KeyFileDataLoader
>;
jest.mock('openid-client', () => {
  return {
    Issuer: {
      // Issuer クラスをモック
      discover: jest.fn(),
    },
  };
});
describe('AppController', () => {
  let authService: AuthService;
  let mockConfigService: { get: jest.Mock };
  const mockIssuerDiscover = Issuer.discover as jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService = {
      get: jest.fn(),
    };

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'IDP_BASE_URL') return 'https://test-idp.example.com';
      if (key === 'KEY_SOURCE_MODE') return 'IDP';
      return undefined;
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.resetAllMocks();
    authService.testClear();
  });
  describe('root', () => {
    it('should environment check normal end SOURCE_MODE is IDP', async () => {
      mockIssuerDiscover.mockResolvedValueOnce({
        metadata: {
          issuer: 'https://test-idp.example.com',
          jwks_uri: 'https://test-idp.example.com/jwks',
          userinfo_endpoint: 'https://test-idp.example.com/user_info',
        },
      });
      await authService.onModuleInit();
      expect(mockConfigService.get).toHaveBeenCalledWith('IDP_BASE_URL');
      expect(mockIssuerDiscover).toHaveBeenCalledWith(
        'https://test-idp.example.com',
      );
      expect(mockConfigService.get).toHaveBeenCalledWith('KEY_SOURCE_MODE');
    });
    it('should throw an error if jwks_uri is not set.', async () => {
      mockIssuerDiscover.mockResolvedValueOnce({
        metadata: {
          issuer: 'https://test-idp.example.com',
        },
      });
      await expect(authService.onModuleInit()).rejects.toThrow(
        "Failed to retrieve public keys: 'jwks_uri' endpoint is not provided in the issuer's metadata.",
      );
      expect(mockIssuerDiscover).toHaveBeenCalledWith(
        'https://test-idp.example.com',
      );
    });
    it('should throw an error if userinfo_endpoint is not set.', async () => {
      mockIssuerDiscover.mockResolvedValueOnce({
        metadata: {
          issuer: 'https://test-idp.example.com',
          jwks_uri: 'https://test-idp.example.com/jwks',
        },
      });
      await expect(authService.onModuleInit()).rejects.toThrow(
        "Failed to retrieve user info: 'userinfo_endpoint' endpoint is not provided in the issuer's metadata.",
      );
      expect(mockIssuerDiscover).toHaveBeenCalledWith(
        'https://test-idp.example.com',
      );
    });
    it('should throw an error if Issuer.discover fails', async () => {
      // discover が Promise.reject するようにモック
      mockIssuerDiscover.mockRejectedValueOnce(
        new Error('Network error during discovery'),
      );

      // onModuleInit が、元のエラーをラップした形でエラーをスローすることを期待
      await expect(authService.onModuleInit()).rejects.toThrow(
        'AuthService initialization failed: Network error during discovery',
      );

      expect(mockIssuerDiscover).toHaveBeenCalledWith(
        'https://test-idp.example.com',
      );
    });
    it('should throw an error if KEY_SOURCE_MODE is not FILE or IDP', async () => {
      mockIssuerDiscover.mockResolvedValueOnce({
        metadata: {
          issuer: 'https://test-idp.example.com',
          jwks_uri: 'https://test-idp.example.com/jwks',
        },
      });
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'IDP_BASE_URL') return 'https://test-idp.example.com';
        if (key === 'KEY_SOURCE_MODE') return 'HOGEHOGE';
        return undefined;
      });
      const module = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();
      const service = module.get<AuthService>(AuthService);
      await expect(service.onModuleInit()).rejects.toThrow(
        `Invalid KEY_SOURCE_MODE: 'HOGEHOGE'.`,
      );
    });
    it('should throw an error if IDP_BASE_URL is not set (constructor test)', async () => {
      mockConfigService.get.mockReturnValueOnce(undefined);
      await expect(
        Test.createTestingModule({
          providers: [
            AuthService,
            { provide: ConfigService, useValue: mockConfigService },
          ],
        }).compile(), // コンストラクタのエラーは compile() でキャッチ
      ).rejects.toThrow('IDP_BASE_URL environment variable is not set.');

      // Issuer.discover は呼び出されないことを確認
      expect(mockIssuerDiscover).not.toHaveBeenCalled();
    });
    it('should throw an error if KEY_SOURCE_MODE is not set (constructor test)', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'IDP_BASE_URL') return 'https://test-idp.example.com';
        return undefined;
      });
      await expect(
        Test.createTestingModule({
          providers: [
            AuthService,
            { provide: ConfigService, useValue: mockConfigService },
          ],
        }).compile(), // コンストラクタのエラーは compile() でキャッチ
      ).rejects.toThrow('KEY_SOURCE_MODE environment variable is not set.');

      // Issuer.discover は呼び出されないことを確認
      expect(mockIssuerDiscover).not.toHaveBeenCalled();
    });
  });
  it('should throw a success if KEY_SOURCE_MODE is FILE', async () => {
    mockIssuerDiscover.mockResolvedValueOnce({
      metadata: {
        issuer: 'https://test-idp.example.com',
        jwks_uri: 'https://test-idp.example.com/jwks',
      },
    });
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'IDP_BASE_URL') return 'https://test-idp.example.com';
      if (key === 'KEY_SOURCE_MODE') return 'FILE';
      if (key === 'KEY_FILE_BASE_PATH') return 'file://base/path';
      return undefined;
    });
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    const service = module.get<AuthService>(AuthService);
    await service.onModuleInit();
    expect(mockConfigService.get).toHaveBeenCalledWith('KEY_FILE_BASE_PATH');
  });

  it('should throw an error if KEY_FILE_BASE_PATH is not set.', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'IDP_BASE_URL') return 'https://test-idp.example.com';
      if (key === 'KEY_SOURCE_MODE') return 'FILE';
      return undefined;
    });
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    const service = module.get<AuthService>(AuthService);
    await expect(service.onModuleInit()).rejects.toThrow(
      `KEY_FILE_BASE_PATH environment variable is not set.`,
    );
  });
  it('should call getUserInfo normal end.', async () => {
    const mockToken = 'some.valid.jwt';
    const mockJwksResponseData = {
      id: 'id',
      name: 'name',
      email: 'email@example.com',
    };
    mockedAxios.get.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    mockIssuerDiscover.mockResolvedValueOnce({
      metadata: {
        issuer: 'https://test-idp.example.com',
        jwks_uri: 'https://test-idp.example.com/jwks',
        userinfo_endpoint: 'https://test-idp.example.com/user_info',
      },
    });
    await authService.onModuleInit();
    const result = await authService.getUserInfo(mockToken);
    expect(result).toEqual(mockJwksResponseData);
  });
  it('should call getUserInfo call failds (network error)', async () => {
    const mockToken = 'some.valid.jwt';
    const errorMessage = 'Network error during user info fetch';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage)); // axios.get がエラーをスロー

    await expect(authService.getUserInfo(mockToken)).rejects.toThrow(
      errorMessage,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // 呼び出されたことだけ確認
  });
  it('should call getUserInfo call failds (axios error response.)', async () => {
    const mockToken = 'some.valid.jwt';
    const mockErrorStatus = HttpStatus.NOT_FOUND;
    const mockErrorMessage = 'User not found';
    const mockAxiosError: any = new Error(
      'Request failed with status code ' + mockErrorStatus,
    );
    mockAxiosError.isAxiosError = true;
    mockAxiosError.response = {
      status: mockErrorStatus,
      data: { message: mockErrorMessage },
      headers: {},
      config: {},
      statusText: 'Internal Server Error',
      request: {},
    };
    mockAxiosError.config = {};
    mockedAxios.get.mockRejectedValueOnce(mockAxiosError);
    mockedIsAxiosError.mockReturnValue(true);
    const expectedErrorMessage = `Failed to get user info from IDP: ${mockErrorStatus} - ${mockErrorMessage}`;
    await expect(authService.getUserInfo(mockToken)).rejects.toThrow(
      expectedErrorMessage,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedIsAxiosError).toHaveBeenCalledWith(expect.any(Error));
  });
  it('should call getUserInfo call failds (axios error response. 500)', async () => {
    const mockToken = 'some.valid.jwt';
    const mockErrorStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    const mockAxiosError: any = new Error(
      'Request failed with status code ' + mockErrorStatus,
    );
    mockAxiosError.isAxiosError = true;
    mockAxiosError.response = {
      status: mockErrorStatus,
      data: {},
      headers: {},
      config: {},
      statusText: 'Internal Server Error',
      request: {},
    };
    mockAxiosError.config = {};
    mockedAxios.get.mockRejectedValueOnce(mockAxiosError);
    mockedIsAxiosError.mockReturnValue(true);
    const expectedErrorMessage = `Failed to get user info from IDP: ${mockErrorStatus} - Unknown error`;
    await expect(authService.getUserInfo(mockToken)).rejects.toThrow(
      expectedErrorMessage,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedIsAxiosError).toHaveBeenCalledWith(expect.any(Error));
  });
  it('should call getUserInfo call failds (unexpected error. 400)', async () => {
    const mockToken = 'some.valid.jwt';
    const errorMessage = 'IDP user info communication error: ';
    await expect(authService.getUserInfo(mockToken)).rejects.toThrow(
      errorMessage,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // 呼び出されたことだけ確認
  });
  it('should call secretOrKeyProvider call OK', async () => {
    const mockToken = createTestJwtWithKid('test-kid', { sub: 'user123' });
    const mockJwksResponseData = {
      keys: [
        {
          kty: 'RSA',
          kid: 'test-kid', // テスト用に使う kid
          use: 'sig',
          alg: 'RS256',
          n: 'dummy_n_value_base64_encoded', // ダミー
          e: 'AQAB', // ダミー
        },
      ],
    };
    mockedAxios.get.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    const realCrypto = require('node:crypto');
    const { publicKey } = realCrypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'jwk' }, // JWK形式で公開鍵を生成
      privateKeyEncoding: { type: 'pkcs8', format: 'jwk' },
    });
    const generatedJwk = publicKey; // 生成されたJWK
    const mockCryptoKey = await realCrypto.webcrypto.subtle.importKey(
      'jwk',
      generatedJwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      true,
      ['verify'],
    );
    mockedJose.importJWK.mockImplementation(() =>
      Promise.resolve(mockCryptoKey),
    );
    mockedJose.exportSPKI.mockImplementation(() =>
      Promise.resolve('hoge-hoge'),
    );
    const doneMock = jest.fn();
    const requestMock = jest.fn();
    await (authService as any).secretOrKeyProvider(
      requestMock,
      mockToken,
      doneMock,
    );
    expect(doneMock).toHaveBeenCalledTimes(1);
  });
  it('should call secretOrKeyProvider call get cache OK', async () => {
    const mockToken = createTestJwtWithKid('test-kid', { sub: 'user123' });
    authService.testSet('test-kid', { jwk: 'hoge-hoge', cachedAt: Date.now() });
    const mockJwksResponseData = {
      keys: [
        {
          kty: 'RSA',
          kid: 'test-kid', // テスト用に使う kid
          use: 'sig',
          alg: 'RS256',
          n: 'dummy_n_value_base64_encoded', // ダミー
          e: 'AQAB', // ダミー
        },
      ],
    };
    mockedAxios.get.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    const realCrypto = require('node:crypto');
    const { publicKey } = realCrypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'jwk' }, // JWK形式で公開鍵を生成
      privateKeyEncoding: { type: 'pkcs8', format: 'jwk' },
    });
    const generatedJwk = publicKey; // 生成されたJWK
    const mockCryptoKey = await realCrypto.webcrypto.subtle.importKey(
      'jwk',
      generatedJwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      true,
      ['verify'],
    );
    mockedJose.importJWK.mockImplementation(() =>
      Promise.resolve(mockCryptoKey),
    );
    mockedJose.exportSPKI.mockImplementation(() =>
      Promise.resolve('hoge-hoge'),
    );
    const doneMock = jest.fn();
    const requestMock = jest.fn();
    await (authService as any).secretOrKeyProvider(
      requestMock,
      mockToken,
      doneMock,
    );
    expect(doneMock).toHaveBeenCalledTimes(1);
  });
  it('should call secretOrKeyProvider call public key is null', async () => {
    const mockToken = createTestJwtWithKid('test-kid', { sub: 'user123' });
    const mockJwksResponseData = {
      keys: [
        {
          kty: 'RSA',
          kid: 'test-kid', // テスト用に使う kid
          use: 'sig',
          alg: 'RS256',
          n: 'dummy_n_value_base64_encoded', // ダミー
          e: 'AQAB', // ダミー
        },
      ],
    };
    mockedAxios.get.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    const mockCryptoKey: CryptoKey = {
      algorithm: { name: 'RS256' },
      extractable: false,
      type: 'public',
      usages: [],
    };
    mockedJose.importJWK.mockImplementation(() =>
      Promise.resolve(mockCryptoKey),
    );

    const doneMock = jest.fn();
    const requestMock = jest.fn();
    const expectedError = new Error(
      'Public key not found for kid: ' + 'test-kid',
    );
    await (authService as any).secretOrKeyProvider(
      requestMock,
      mockToken,
      doneMock,
    );
    expect(doneMock).toHaveBeenCalledTimes(1);
    expect(doneMock).toHaveBeenCalledWith(expectedError); // エラーオブジェクトが渡されたことを確認
    expect(doneMock).not.toHaveBeenCalledWith(null, expect.anything()); // 成功パスでは呼ばれないことを確認  });
  });
  it('should call secretOrKeyProvider call axios response error', async () => {
    const mockToken = createTestJwtWithKid('test-kid', { sub: 'user123' });
    mockedAxios.get.mockResolvedValueOnce({
      data: [],
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    const doneMock = jest.fn();
    const requestMock = jest.fn();
    const expectedError = new Error('secretOrKeyProvider faild.');
    await (authService as any).secretOrKeyProvider(
      requestMock,
      mockToken,
      doneMock,
    );
    expect(doneMock).toHaveBeenCalledTimes(1);
    expect(doneMock).toHaveBeenCalledWith(expectedError); // エラーオブジェクトが渡されたことを確認
    expect(doneMock).not.toHaveBeenCalledWith(null, expect.anything()); // 成功パスでは呼ばれないことを確認  });
  });
  it('should call secretOrKeyProvider call if KEY_SOURCE_MODE is FILE', async () => {
    const mockToken = createTestJwtWithKid('test-kid', { sub: 'user123' });
    mockIssuerDiscover.mockResolvedValueOnce({
      metadata: {
        issuer: 'https://test-idp.example.com',
        jwks_uri: 'https://test-idp.example.com/jwks',
        userinfo_endpoint: 'https://test-idp.example.com/user_info',
      },
    });
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'IDP_BASE_URL') return 'https://test-idp.example.com';
      if (key === 'KEY_SOURCE_MODE') return 'FILE';
      if (key === 'KEY_FILE_BASE_PATH') return 'file://base/path';
      return undefined;
    });
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    const service = module.get<AuthService>(AuthService);
    await service.onModuleInit(); // KEY_FILE_BASE_PATHを設定する

    const doneMock = jest.fn();
    const requestMock = jest.fn();
    const keyloadSpy = jest
      .spyOn(KeyFileDataLoader, 'keyload')
      .mockImplementation((url: string) => {
        if (url === 'file://base/path/test-kid') {
          return { key: 'mock_key_data_from_test' };
        }
        throw new Error('Mocked key not found for URL: ' + url);
      });
    await (service as any).secretOrKeyProvider(
      requestMock,
      mockToken,
      doneMock,
    );
    expect(mockConfigService.get).toHaveBeenCalledWith('KEY_FILE_BASE_PATH');
    keyloadSpy.mockRestore();
  });
});
