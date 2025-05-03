import { Test, TestingModule } from '@nestjs/testing';
import { TrustedListController } from './trusted-list.controller';
import { TrustedListService } from './trusted-list.service';

describe('TrustedListController', () => {
  let trustedListController: TrustedListController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TrustedListController],
      providers: [TrustedListService],
    }).compile();

    trustedListController = app.get<TrustedListController>(
      TrustedListController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(trustedListController.getHello()).toBe('Hello World!');
    });
  });
});
