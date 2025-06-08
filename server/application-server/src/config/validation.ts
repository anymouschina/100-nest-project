import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  WECHAT_APP_ID: Joi.string().required(),
  WECHAT_APP_SECRET: Joi.string().required(),
  JWT_SECRET: Joi.string().default(
    'your-secret-key-should-be-changed-in-production',
  ),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  MOONSHOT_API_KEY: Joi.string().default(
    'sk-jBeHas7PWHmKPEsbPkNOB9GaSyPJI8Z9QwEvTuJl0vHNDUUW',
  ),
  MOONSHOT_BASE_URL: Joi.string().default('https://api.moonshot.cn/v1'),
  MOONSHOT_MODEL: Joi.string().default('moonshot-v1-8k'),
});