const rateLimiter            = require('express-rate-limit');
const {windowMs, RATE_LIMIT} = require("../config/config");
const limiter                = () =>
    rateLimiter({
        windowMs: windowMs,
        max     : RATE_LIMIT,
        headers : true,
        stats   : 'fail',
        message : "Woh, Slow down! You are making too many requests."
    });

module.exports = limiter;
