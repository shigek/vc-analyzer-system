import { Test, TestingModule } from '@nestjs/testing';
import { ExternalApiController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: ExternalApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ExternalApiController],
      providers: [AppService],
    }).compile();

    appController = app.get<ExternalApiController>(ExternalApiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.haldleHello()).toBe('Hello World!');
    });
  });
});
