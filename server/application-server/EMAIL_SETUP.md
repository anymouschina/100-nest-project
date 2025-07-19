# 邮箱注册功能使用说明

## 功能概述
本项目已集成阿里云邮件推送服务，支持邮箱注册和登录功能。

## 配置步骤

### 1. 阿里云邮件推送配置

#### 申请阿里云邮件推送服务
1. 登录阿里云控制台
2. 进入【邮件推送】服务
3. 创建发信域名（如：mail.yourdomain.com）
4. 配置DNS解析记录
5. 创建发信地址（如：noreply@yourdomain.com）

#### 获取SMTP配置信息
- **SMTP服务器地址**：smtpdm.aliyun.com
- **SMTP端口**：465（SSL）或 80（不加密）
- **用户名**：你的完整邮箱地址
- **密码**：在阿里云控制台生成的SMTP密码

### 2. 环境变量配置

修改 `.env` 文件，添加以下配置：

```bash
# 阿里云邮件推送配置
MAIL_HOST=smtpdm.aliyun.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your-email@your-domain.com
MAIL_PASS=your-smtp-password
MAIL_FROM=your-email@your-domain.com
```

### 3. 使用API接口

#### 发送验证码
```bash
curl -X POST http://localhost:3001/api/email/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### 邮箱注册
```bash
curl -X POST http://localhost:3001/api/email/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "password": "Password123",
    "name": "用户名"
  }'
```

#### 邮箱登录
```bash
curl -X POST http://localhost:3001/api/email/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

## 功能特点

### 验证码机制
- **有效期**：10分钟
- **频率限制**：60秒内只能发送一次
- **验证码长度**：6位数字
- **错误提示**：友好的错误信息提示

### 安全特性
- 密码加密存储（bcrypt）
- JWT身份验证
- 防暴力破解（频率限制）
- 邮箱唯一性验证

### 密码要求
- 长度：6-20位
- 必须包含：大小写字母和数字
- 不能包含空格

## 测试建议

### 1. 测试邮件发送
```bash
# 测试邮件服务连接
curl -X GET http://localhost:3001/api/email/test
```

### 2. 测试流程
1. 发送验证码到测试邮箱
2. 检查邮箱是否收到验证码
3. 使用验证码完成注册
4. 使用注册的邮箱和密码登录

## 常见问题

### 1. 邮件发送失败
- 检查阿里云SMTP配置是否正确
- 确认发信域名已验证
- 检查邮箱地址格式

### 2. 验证码无效
- 确认验证码未过期（10分钟）
- 检查验证码是否正确输入
- 尝试重新发送验证码

### 3. 注册失败
- 检查邮箱是否已被注册
- 确认密码符合要求
- 验证验证码是否正确

## 扩展功能

### 1. 找回密码
可以通过类似的方式实现密码重置功能

### 2. 邮箱绑定
已有微信用户可以绑定邮箱作为备用登录方式

### 3. 邮箱通知
订单状态变更、活动通知等邮件提醒功能

## 技术支持

如有问题，请检查：
1. 阿里云邮件推送服务状态
2. Redis服务是否正常运行
3. 环境变量配置是否正确
4. 查看应用日志获取详细错误信息