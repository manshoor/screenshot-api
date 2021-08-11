module.exports = {
  REDIS_URL: process.env.REDIS_URL || "redis",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  APP_SECRET: process.env.APP_SECRET,
  PORT: process.env.PORT || 3000,
  APP_DOMAIN: process.env.APP_DOMAIN || 'http://localhost:3000',
};
