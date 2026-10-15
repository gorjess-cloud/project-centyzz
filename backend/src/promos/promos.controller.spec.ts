import { Test, TestingModule } from '@nestjs/testing';
import { PromosController } from './promos.controller.js';

describe('PromosController', () => {
  let controller: PromosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromosController],
    }).compile();

    controller = module.get<PromosController>(PromosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
