module.exports = {
    REDIS_URL : process.env.REDIS_URL || "redis",
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    APP_SECRET: process.env.APP_SECRET,
    PORT      : process.env.PORT || 3000,
    windowMs  : 60 * 60 * 1000, // 15 minutes
    RATE_LIMIT: process.env.RATE_LIMIT || 20, // limit each IP to 100 requests per windowMs
    APP_DOMAIN: process.env.APP_DOMAIN || 'http://localhost:3000',
};
