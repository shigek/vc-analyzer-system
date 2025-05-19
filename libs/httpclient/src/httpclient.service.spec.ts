import { Test, TestingModule } from '@nestjs/testing';
import { HttpClientConfigService } from './httpclient.service';

describe('HttpclientService', () => {
  let service: HttpClientConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpClientConfigService],
    }).compile();

    service = module.get<HttpClientConfigService>(HttpClientConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
