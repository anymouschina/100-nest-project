import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  WECHAT_APP_ID: Joi.string().required(),
  WECHAT_APP_SECRET: Joi.string().required(),
  JWT_SECRET: Joi.string().default('your-secret-key-should-be-changed-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
}); 