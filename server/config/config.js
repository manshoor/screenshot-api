module.exports = {
  REDIS_URL: process.env.REDIS_URL || "redis",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  APP_SECRET: process.env.APP_SECRET || 'cb076ff5f52e660736ed0c0867a627f2',
  PORT: process.env.PORT || 3000,
};
