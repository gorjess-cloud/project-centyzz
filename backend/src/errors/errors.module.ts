
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { ErrorLoggingService } from './error-logging.service.js';
import { GlobalExceptionFilter } from './global-exception.filter.js';

@Module({
  providers: [
    ErrorLoggingService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [ErrorLoggingService],
})
export class ErrorsModule {}
