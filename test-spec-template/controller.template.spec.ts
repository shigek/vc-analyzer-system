import { Test, TestingModule } from '@nestjs/testing';
import { ExternalApiController } from './app.controller';
import { AppService } from './app.service';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ResolverClientService } from './services/client/resolver.client.service';
import * as jose from 'jose';
import axios, {
  AxiosInstance,
  AxiosInterceptorManager,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { HttpClientConfigService } from 'lib/httpclient';
import { ConfigService } from '@nestjs/config';
import { InternalAuthService } from 'lib/httpclient/internal-auth.service';
import { ExternalServiceExceptinsFilter } from 'lib/httpclient/filters/external-exceptions.filter';
import { ShareService } from 'lib/share';
import { StatusListClientService } from './services/client/status-list.client.service';
import { TrustedListClientService } from './services/client/trusted-list.client.service';
import { Response, Request } from 'express';
import {
  ExecutionContext,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

// --- Step 1: Mock化された AxiosInstance の型を正確に定義する ---
// 各メソッドが `jest.Mock` であることを明示的に示します。
// AxiosInterceptorManager のメソッドも Jest のモック関数として定義します。
type MockedAxiosInterceptorManager<V> = {
  use: jest.Mock<
    ReturnType<AxiosInterceptorManager<V>['use']>,
    Parameters<AxiosInterceptorManager<V>['use']>
  >;
  eject: jest.Mock<
    ReturnType<AxiosInterceptorManager<V>['eject']>,
    Parameters<AxiosInterceptorManager<V>['eject']>
  >;
  clear: jest.Mock<
    ReturnType<AxiosInterceptorManager<V>['clear']>,
    Parameters<AxiosInterceptorManager<V>['clear']>
  >;
};

type MockedAxiosInstance = Partial<{
  [K in keyof AxiosInstance]: AxiosInstance[K] extends (...args: any[]) => any
  ? jest.Mock<ReturnType<AxiosInstance[K]>, Parameters<AxiosInstance[K]>>
  : AxiosInstance[K];
}> & {
  // interceptors を正確な型で定義
  interceptors: {
    request: MockedAxiosInterceptorManager<AxiosRequestConfig>;
    response: MockedAxiosInterceptorManager<AxiosResponse>;
  };
  defaults?: {};
};

// --- Step 2: `jest.mock('axios')` の実装 ---
jest.mock('axios', () => {
  // `mockAxiosInstance` の内部メソッドと interceptors のメソッドを正確な Jest.Mock 型で定義
  const mockAxiosInstance: MockedAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    request: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(), // ここも明示的に jest.Mock<...> としても良いが、型の推論に任せる
        eject: jest.fn(),
        clear: jest.fn(),
      } as MockedAxiosInterceptorManager<AxiosRequestConfig>, // <<<<<<< ここで型を適用
      response: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn(),
      } as MockedAxiosInterceptorManager<AxiosResponse>, // <<<<<<< ここで型を適用
    },
    // defaults: {} // 使用する場合のみ追加
  };

  return {
    create: jest.fn<MockedAxiosInstance, []>(() => mockAxiosInstance),

    // グローバルな `axios` メソッドも同様に、正確な Jest.Mock 型で定義
    get: jest.fn<ReturnType<typeof axios.get>, Parameters<typeof axios.get>>(),
    post: jest.fn<
      ReturnType<typeof axios.post>,
      Parameters<typeof axios.post>
    >(),
    put: jest.fn<ReturnType<typeof axios.put>, Parameters<typeof axios.put>>(),
    delete: jest.fn<
      ReturnType<typeof axios.delete>,
      Parameters<typeof axios.delete>
    >(),
    patch: jest.fn<
      ReturnType<typeof axios.patch>,
      Parameters<typeof axios.patch>
    >(),
    request: jest.fn<
      ReturnType<typeof axios.request>,
      Parameters<typeof axios.request>
    >(),
    head: jest.fn<
      ReturnType<typeof axios.head>,
      Parameters<typeof axios.head>
    >(),
    options: jest.fn<
      ReturnType<typeof axios.options>,
      Parameters<typeof axios.options>
    >(),

    isAxiosError: jest.fn((error: any) => error && error.isAxiosError),

    all: jest.fn(),
    spread: jest.fn(),

    // グローバルなインターセプターも正確な型で定義
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn(),
      } as MockedAxiosInterceptorManager<AxiosRequestConfig>, // <<<<<<< ここで型を適用
      response: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn(),
      } as MockedAxiosInterceptorManager<AxiosResponse>, // <<<<<<< ここで型を適用
    },
    defaults: {},
  };
});

// --- Step 3: `mockedAxios` の型アサーション (変更なし) ---
type MockedAxiosModule = jest.Mocked<typeof axios> & {
  create: jest.Mock<MockedAxiosInstance, []>;
};
const mockedAxios = axios as MockedAxiosModule;
const mockedJose = jose as jest.Mocked<typeof jose>;
describe('AppController', () => {
  let app: INestApplication;
  let appController: ExternalApiController;
  let resolverService: ResolverClientService;
  let statusListService: StatusListClientService;
  let trustedListService: TrustedListClientService;
  let configService: ConfigService;
  let httpClientMock: Partial<jest.Mocked<AxiosInstance>>;
  let appService: AppService;
  let mockResponse: Partial<Response>; // Response 型の部分的なモック
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;
  const mockAuthGuardSuccess = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest<Request>();
      // `req.user` に、戦略が設定すると期待される値を設定
      req.user = {
        scopes: ['status-list:manage', 'trusted-list:manage', 'trusted-list:admin'],
        clientId: 'vc-analyzer-management-client',
      };
      return true; // 常に認証成功を返す
    },
  };

  // 認証失敗をシミュレートするモックガード
  const mockAuthGuardFailure = {
    canActivate: (context: ExecutionContext) => {
      throw new UnauthorizedException('Authentication failed for test'); // 認証失敗をスロー
    },
  };
  const mockConfigService = {
    // get メソッドをモックします。
    // テストしたい設定値を、それぞれの get 呼び出しに応じて返せるように設定します。
    get: jest.fn((key: string) => {
      switch (key) {
        case 'GATEWAY_KEY_DATA':
          return 'file://../../../../../.certs/13516f26-8761-467d-b7f7-2ee96d23c063';
        case 'GATEWAY_KEY':
          return '13516f26-8761-467d-b7f7-2ee96d23c063';
        case 'GATEWAY_SERVICE_NAME':
          return 'vc-analyzer-gateway';
        case 'DID_RESOLVER_URL':
          return 'http://localhost:3001';
        case 'STATUS_LIST_URL':
          return 'http://localhost:3002';
        case 'TRUSTED_LIST_URL':
          return 'http://localhost:3003';
        case 'DID_RESOLVER_SERVICE_NAME':
          return 'vc-analyzer-resolver';
        case 'UNIVERSAL_RESOLVER_URL':
          return 'https://dev.uniresolver.io';
        case 'UNIVERSAL_RESOLVER_PATH':
          return '1.0/identifiers';

        default:
          return undefined; // 未定義の設定値はundefinedを返す
      }
    }),
  };
  const mockAppService = {
    getHello: jest.fn(),
    getContext: jest.fn(),
  };
  beforeEach(async () => {
    // 各テストケースの前に、モックの呼び出し履歴と挙動をリセット
    mockedAxios.create.mockClear(); // create メソッドの履歴もクリア
    mockedAxios.get.mockReset(); // mockAxiosInstance の get/post もリセット
    mockedAxios.post.mockReset();
    mockedAxios.patch.mockReset();
    mockedAxios.delete.mockReset();
    mockedAxios.isAxiosError.mockClear();
    mockedAxios.isAxiosError.mockImplementation(
      (error: any) => error && error.isAxiosError,
    );
    const globalRequestUse = mockedAxios.interceptors.request.use as jest.Mock<
      number,
      [
        (
          value: AxiosRequestConfig,
        ) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
        (error: any) => any,
      ]
    >;
    const globalRequestEject = mockedAxios.interceptors.request
      .eject as jest.Mock<void, [id: number]>;
    const globalRequestClear = mockedAxios.interceptors.request
      .clear as jest.Mock<void, []>;

    const globalResponseUse = mockedAxios.interceptors.response
      .use as jest.Mock<
        number,
        [
          (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
          (error: any) => any,
        ]
      >;
    const globalResponseEject = mockedAxios.interceptors.response
      .eject as jest.Mock<void, [id: number]>;
    const globalResponseClear = mockedAxios.interceptors.response
      .clear as jest.Mock<void, []>;

    globalRequestUse.mockReset();
    globalRequestEject.mockReset();
    globalRequestClear.mockReset();
    globalResponseUse.mockReset();
    globalResponseEject.mockReset();
    globalResponseClear.mockReset();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExternalApiController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        ResolverClientService,
        StatusListClientService,
        TrustedListClientService,
        HttpClientConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        InternalAuthService,
        ExternalServiceExceptinsFilter,
        ShareService,
      ],
    })
      .overrideGuard(AuthGuard('jwt')) // 実際の AuthGuard('gateway-jwt') を
      .useValue(mockAuthGuardSuccess) // 作成したモックに置き換える
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init(); // アプリケーションを初期化
    resolverService = app.get<ResolverClientService>(ResolverClientService);
    statusListService = app.get<StatusListClientService>(
      StatusListClientService,
    );
    trustedListService = app.get<TrustedListClientService>(
      TrustedListClientService,
    );
    appService = app.get<AppService>(AppService);
    configService = app.get<ConfigService>(ConfigService);

    if (typeof (resolverService as any).onModuleInit === 'function') {
      await (resolverService as any).onModuleInit();
    } else {
      // onModuleInit が実装されていない、あるいは呼び出されない場合の警告
      console.warn(
        'Service does not implement onModuleInit or it was not called. Check service setup.',
      );
    }

    if (typeof (statusListService as any).onModuleInit === 'function') {
      await (statusListService as any).onModuleInit();
    } else {
      // onModuleInit が実装されていない、あるいは呼び出されない場合の警告
      console.warn(
        'Service does not implement onModuleInit or it was not called. Check service setup.',
      );
    }

    if (typeof (trustedListService as any).onModuleInit === 'function') {
      await (trustedListService as any).onModuleInit();
    } else {
      // onModuleInit が実装されていない、あるいは呼び出されない場合の警告
      console.warn(
        'Service does not implement onModuleInit or it was not called. Check service setup.',
      );
    }

    // デバッグ用のログ
    httpClientMock = mockedAxios.create.mock.results[0]?.value;
    if (httpClientMock && httpClientMock.interceptors) {
      httpClientMock.get?.mockReset();
      httpClientMock.post?.mockReset();
      httpClientMock.patch?.mockReset();
      httpClientMock.delete?.mockReset();
      // ... 他のインスタンスメソッドもリセット (put, delete, etc.)
      const requestUse = httpClientMock.interceptors.request.use as jest.Mock<
        number,
        [
          (
            value: AxiosRequestConfig,
          ) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
          (error: any) => any,
        ]
      >;
      const requestEject = httpClientMock.interceptors.request
        .eject as jest.Mock<void, [id: number]>;
      const requestClear = httpClientMock.interceptors.request
        .clear as jest.Mock<void, []>;

      const responseUse = httpClientMock.interceptors.response.use as jest.Mock<
        number,
        [
          (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
          (error: any) => any,
        ]
      >;
      const responseEject = httpClientMock.interceptors.response
        .eject as jest.Mock<void, [id: number]>;
      const responseClear = httpClientMock.interceptors.response
        .clear as jest.Mock<void, []>;

      requestUse.mockReset();
      requestEject.mockReset();
      requestClear.mockReset();
      responseUse.mockReset();
      responseEject.mockReset();
      responseClear.mockReset();

      mockSend = jest.fn();
      mockStatus = jest.fn().mockReturnThis();
      mockResponse = {
        status: mockStatus,
        send: mockSend,
        // 必要であれば他の Express Response メソッドも追加
        // 例: json: jest.fn(), header: jest.fn(), end: jest.fn(), redirect: jest.fn()
      };
    } else {
      throw new Error(
        'axios.create() was not called or did not return an instance in the service constructor.',
      );
    }
  });
  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });
  describe('root', () => {
    it('should return "Hello World!"', async () => {
      await request(app.getHttpServer())
        .get('/analyzer-gateway')
        .expect(HttpStatus.OK);
    });
    it('should call /contexts/trusted-list/v1 OK', async () => {
      mockAppService.getContext.mockReturnValue({
        status: HttpStatus.OK,
        data: 'hogehoge',
      });
      await request(app.getHttpServer())
        .get('/analyzer-gateway/contexts/trusted-list/v1')
        .expect(HttpStatus.OK)
        .expect('Content-Type', /text/);
    });
    it('should call /contexts/trusted-list/v1 NOT_FOUND', async () => {
      mockAppService.getContext.mockReturnValue({
        status: HttpStatus.NOT_FOUND,
      });
      await request(app.getHttpServer())
        .get('/analyzer-gateway/contexts/trusted-list/v1')
        .expect(HttpStatus.NOT_FOUND)
        .expect('Content-Type', /text/);
    });
    it('should call /resolver/:did', async () => {
      const mockJwksResponseData = {
        a: 'hogehoge',
      };
      httpClientMock.get!.mockResolvedValueOnce({
        data: mockJwksResponseData,
        status: HttpStatus.OK,
        statusText: 'OK',
        headers: {},
        config: {},
      });
      await request(app.getHttpServer())
        .get('/analyzer-gateway/verifier/resolve/did:key:abcd')
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);
    });
  });
  it('should call /status-lists/:listId/status/index', async () => {
    const mockJwksResponseData = {
      a: 'hogehoge',
    };
    httpClientMock.get!.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    await request(app.getHttpServer())
      .get('/analyzer-gateway/verifier/status-lists/listId/status/1')
      .expect(HttpStatus.OK)
      .expect('Content-Type', /json/);
  });
  it('should call /status-lists', async () => {
    const dto = {};
    const mockJwksResponseData = {
      a: 'hogehoge',
    };
    httpClientMock.post!.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.CREATED,
      statusText: 'CREATED',
      headers: {},
      config: {},
    });
    await request(app.getHttpServer())
      .post('/analyzer-gateway/manager/status-lists')
      .send(dto)
      .expect(HttpStatus.CREATED)
      .expect('Content-Type', /json/);
  });
  it('should call /status-lists/:listId/status/:index', async () => {
    const dto = {
      status: 'revoked',
    }
    const mockJwksResponseData = {
      a: 'hogehoge',
    };
    httpClientMock.patch!.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    await request(app.getHttpServer())
      .patch('/analyzer-gateway/manager/status-lists/listId/status/1')
      .send(dto)
      .expect(HttpStatus.OK)
      .expect('Content-Type', /json/);
  });
  it('should call /trusted-issuers', async () => {
    const dto = {
      subjectDid: 'did:key:abcd',
    }
    const mockJwksResponseData = {
      a: 'hogehoge',
    };
    httpClientMock.post!.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.CREATED,
      statusText: 'CREATED',
      headers: {},
      config: {},
    });
    await request(app.getHttpServer())
      .post('/analyzer-gateway/manager/trusted-issuers')
      .send(dto)
      .expect(HttpStatus.CREATED)
      .expect('Content-Type', /json/);
  });
  it('should call /trusted-issuers/:subjectDid', async () => {
    const dto = {
      validUntil: '2024-11-03T01:23:56.789Z',
    }
    const mockJwksResponseData = {
      a: 'hogehoge',
    };
    httpClientMock.patch!.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    await request(app.getHttpServer())
      .patch('/analyzer-gateway/manager/trusted-issuers/did:key:abcd')
      .send(dto)
      .expect(HttpStatus.OK)
      .expect('Content-Type', /json/);
  });
  it('should call /trusted-issuers/:subjectDid', async () => {
    const mockJwksResponseData = {
      a: 'hogehoge',
    };
    httpClientMock.delete!.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    await request(app.getHttpServer())
      .delete('/analyzer-gateway/manager/trusted-issuers/did:key:abcd')
      .expect(HttpStatus.OK)
      .expect('Content-Type', /json/);
  });
  it('should call /trusted-issuers', async () => {
    const mockJwksResponseData = {
      a: [{data: 'hogehoge'}],
    };
    httpClientMock.get!.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    await request(app.getHttpServer())
      .get('/analyzer-gateway/admin/trusted-issuers')
      .expect(HttpStatus.OK)
      .expect('Content-Type', /json/);
  });
  it('should call /trusted-issuers/:subjectDid', async () => {
    const mockJwksResponseData = {
      a: 'hogehoge',
    };
    httpClientMock.get!.mockResolvedValueOnce({
      data: mockJwksResponseData,
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    await request(app.getHttpServer())
      .get('/analyzer-gateway/verifier/trusted-issuers/did:key:abcd')
      .expect(HttpStatus.OK)
      .expect('Content-Type', /json/);
  });
});
