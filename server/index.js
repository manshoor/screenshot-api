'use strict';
const express                      = require("express");
const rateLimit                    = require('express-rate-limit');
const cors                         = require("cors");
const {PORT, windowMs, RATE_LIMIT} = require("./config/config");
const screenshotRouter             = require("./routes/screenshotRouter");
const app                          = express();

const limiter = rateLimit({
    windowMs: windowMs, // 1 minute
    max     : RATE_LIMIT, // limit each IP to 2 requests per windowMs
    headers : true,
    handler : function (req, res, /*next*/) {
        console.log(` -------> \n ${req.ip} exceeded the rate limit. \n`);
        return res.status(429).json({
            status: 'error',
            error : 'Woh, Slow down! You are making too many requests.'
        });
    }
});

// Use the limit rule as an application middleware
app.use(limiter);

app.enable("trust proxy");
app.use(cors({}));
app.use(express.json());
app.disable('x-powered-by');

app.get("/", (req, res) => {
    res.send("<h2>Reinventing the wheel. Again. </h2>");
    console.log(" \n -------> Reinventing the wheel. Again. \n ");
});
app.get("/api/v1", (req, res) => {
    res.send("<h2>welcome to screenshot API</h2>");
    console.log(" \n -------> yeah it ran \n ");
});
app.use(express.static(__dirname + '/tmp'));
app.use("/api/v1/screenshot", screenshotRouter);
// process.on('warning', e => console.warn(e.stack));
const server            = app.listen(PORT, () => console.log(` \n -------> listening on port ${PORT} \n`));
server.keepAliveTimeout = 61 * 1000;
