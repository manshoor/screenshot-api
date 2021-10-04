const rateLimit              = require('express-rate-limit');
const {windowMs, RATE_LIMIT} = require("../config/config");
const limiter                = () =>
    rateLimit({
        windowMs: windowMs, // 15 minutes
        max     : RATE_LIMIT, // limit each IP to 100 requests per windowMs
    });

module.exports = limiter;
