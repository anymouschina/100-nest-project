export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-should-be-changed-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
}); 