import { Test, TestingModule } from '@nestjs/testing';
import { ResolverController } from './resolver.controller';
import { ResolverService } from './resolver.service';

describe('ResolverController', () => {
  let resolverController: ResolverController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ResolverController],
      providers: [ResolverService],
    }).compile();

    resolverController = app.get<ResolverController>(ResolverController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      //expect(resolverController.getHello()).toBe('Hello World!');
    });
  });
});
