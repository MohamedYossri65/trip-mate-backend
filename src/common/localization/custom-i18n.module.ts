import { Global, Module } from '@nestjs/common';
import { CustomI18nService } from './custom-i18n.service';

@Global()
@Module({
  providers: [CustomI18nService],
  exports: [CustomI18nService],
})
export class CustomI18nModule {}
