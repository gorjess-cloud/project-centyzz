import { Controller, Get, Module } from '@nestjs/common';
import { SalonConfigService } from './salon-config.service.js';
@Controller('api/salon')
class SalonPublicController {
  constructor(private readonly config: SalonConfigService) {}
  @Get('profile') profile() {
    return this.config.publicProfile();
  }
}
@Module({
  providers: [SalonConfigService],
  controllers: [SalonPublicController],
  exports: [SalonConfigService],
})
export class SalonConfigModule {}
