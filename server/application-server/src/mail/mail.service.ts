import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const mailConfig = this.configService.get('mail');
    
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: mailConfig.auth,
    });

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('邮件服务连接失败:', error);
      } else {
        this.logger.log('邮件服务连接成功');
      }
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const mailConfig = this.configService.get('mail');
      
      const info = await this.transporter.sendMail({
        from: mailConfig.from,
        to,
        subject,
        html,
      });

      this.logger.log(`邮件发送成功: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error('邮件发送失败:', error);
      throw error;
    }
  }

  async sendVerificationCode(to: string, code: string, expireMinutes: number = 10) {
    const mailConfig = this.configService.get('mail');
    const template = mailConfig.templates.verification;
    
    return this.sendMail(
      to,
      template.subject,
      template.template(code, expireMinutes)
    );
  }

  async sendPasswordResetCode(to: string, code: string, expireMinutes: number = 10) {
    const mailConfig = this.configService.get('mail');
    const template = mailConfig.templates.passwordReset;
    
    return this.sendMail(
      to,
      template.subject,
      template.template(code, expireMinutes)
    );
  }

  async sendOrderConfirmation(to: string, orderNumber: string, totalAmount: number) {
    const mailConfig = this.configService.get('mail');
    const template = mailConfig.templates.orderConfirmation;
    
    return this.sendMail(
      to,
      template.subject,
      template.template(orderNumber, totalAmount)
    );
  }

  async sendWelcomeEmail(to: string, username: string) {
    const mailConfig = this.configService.get('mail');
    const template = mailConfig.templates.welcome;
    
    return this.sendMail(
      to,
      template.subject,
      template.template(username)
    );
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: '邮件服务连接正常' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}