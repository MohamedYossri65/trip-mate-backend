import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class CustomI18nService {
  constructor(private i18n: I18nService) {}

  public t(key: string, options?: any): string {
    if (!this.i18n) {
      console.error('I18nService is not available in CustomI18nService');
      // Return the key as fallback
      return key;
    }

    try {
      const lang = 'ar';
      return this.i18n.t(key, { lang, ...options });
    } catch (error) {
      console.error(`I18n translation error for key "${key}":`, error);
      // Return the key as fallback
      return key;
    }
  }
}
