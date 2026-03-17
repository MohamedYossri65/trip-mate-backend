import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Handlebars from 'handlebars';
import { NotificationTemplate } from '../entity/notification-template.entity';
import { NotificationChannel } from '../enums';
import { Account } from 'src/module/account/entity/account.entity';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly defaultLanguage: string;

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {
    this.defaultLanguage = process.env.DEFAULT_LANGUAGE || 'ar';
  }

  /**
   * Get template with fallback to default language
   */
  async getTemplate(
    templateKey: string,
    language: string,
    channel: NotificationChannel = NotificationChannel.PUSH,
  ): Promise<NotificationTemplate | null> {
    // 1. Try exact language match
    let template = await this.templateRepo.findOne({
      where: { templateKey, language, channel },
    });

    // 2. Fallback to default language
    if (!template && language !== this.defaultLanguage) {
      this.logger.warn(
        `Template "${templateKey}" not found for lang="${language}", falling back to "${this.defaultLanguage}"`,
      );
      template = await this.templateRepo.findOne({
        where: { templateKey, language: this.defaultLanguage, channel },
      });
    }

    // 3. Fallback to English if default also missing
    if (!template && this.defaultLanguage !== 'en') {
      this.logger.warn(
        `Template "${templateKey}" not found for default lang, falling back to "en"`,
      );
      template = await this.templateRepo.findOne({
        where: { templateKey, language: 'en', channel },
      });
    }

    return template;
  }

  /**
   * Render a Handlebars template string with variables
   */
  render(templateStr: string, variables: Record<string, any>): string {
    const compiled = Handlebars.compile(templateStr);
    return compiled(variables);
  }

  /**
   * Full flow: get user language -> find template -> render
   */
  async buildNotification(
    templateKey: string,
    accountId: bigint,
    data: Record<string, any>,
    channel: NotificationChannel = NotificationChannel.PUSH,
  ): Promise<{ title: string; body: string; direction: string } | null> {
    // 1. Get user language
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });

    const language = account?.language || this.defaultLanguage;

    // 2. Load template
    const template = await this.getTemplate(templateKey, language, channel);

    if (!template) {
      this.logger.error(
        `No template found for key="${templateKey}", lang="${language}", channel="${channel}"`,
      );
      return null;
    }

    // 3. Render with variables
    const title = this.render(template.titleTemplate, data);
    const body = this.render(template.bodyTemplate, data);

    return {
      title,
      body,
      direction: template.direction,
    };
  }
}
