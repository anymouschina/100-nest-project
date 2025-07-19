import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtpdm.aliyun.com',
  port: parseInt(process.env.MAIL_PORT, 10) || 465,
  secure: process.env.MAIL_SECURE === 'true' || true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  from: process.env.MAIL_FROM || process.env.MAIL_USER,
  templates: {
    verification: {
      subject: '邮箱验证码 - 请验证您的邮箱',
      template: (code: string, expireMinutes: number) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">邮箱验证</h2>
          <p>您好！</p>
          <p>您正在注册账号，请使用以下验证码完成验证：</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px;">${code}</span>
          </div>
          <p>验证码将在 <strong>${expireMinutes}分钟</strong> 后过期。</p>
          <p>如果这不是您的操作，请忽略此邮件。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">这是一封自动发送的邮件，请勿直接回复。</p>
        </div>
      `,
    },
    passwordReset: {
      subject: '密码重置 - 请重置您的密码',
      template: (code: string, expireMinutes: number) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">密码重置</h2>
          <p>您好！</p>
          <p>您正在重置密码，请使用以下验证码：</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px;">${code}</span>
          </div>
          <p>验证码将在 <strong>${expireMinutes}分钟</strong> 后过期。</p>
          <p>如果这不是您的操作，请忽略此邮件。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">这是一封自动发送的邮件，请勿直接回复。</p>
        </div>
      `,
    },
    orderConfirmation: {
      subject: '订单确认 - 您的订单已提交成功',
      template: (orderNumber: string, totalAmount: number) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">订单确认</h2>
          <p>您好！</p>
          <p>您的订单已成功提交，详细信息如下：</p>
          <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0;">
            <p><strong>订单号：</strong> ${orderNumber}</p>
            <p><strong>订单金额：</strong> ¥${totalAmount.toFixed(2)}</p>
            <p><strong>订单状态：</strong> 已提交，等待处理</p>
          </div>
          <p>我们会尽快为您处理订单，请耐心等待。</p>
          <p>如有疑问，请联系客服。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">这是一封自动发送的邮件，请勿直接回复。</p>
        </div>
      `,
    },
    welcome: {
      subject: '欢迎加入 - 感谢您的注册',
      template: (username: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">欢迎加入我们！</h2>
          <p>尊敬的 ${username}，您好！</p>
          <p>感谢您注册我们的服务！您的账号已成功创建。</p>
          <div style="background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p style="margin: 0; color: #2e7d2e;">🎉 恭喜！您现在可以享受我们的所有服务了。</p>
          </div>
          <p>如果您有任何问题，请随时联系我们的客服团队。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">这是一封自动发送的邮件，请勿直接回复。</p>
        </div>
      `,
    },
  },
}));