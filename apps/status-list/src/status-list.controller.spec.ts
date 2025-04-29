import { Test, TestingModule } from '@nestjs/testing';
import { StatusListController } from './status-list.controller';
import { StatusListService } from './status-list.service';

describe('StatusListController', () => {
  let statusListController: StatusListController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [StatusListController],
      providers: [StatusListService],
    }).compile();

    statusListController = app.get<StatusListController>(StatusListController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(statusListController.getHello()).toBe('Hello World!');
    });
  });
});
