const {
          REDIS_PORT,
          REDIS_URL,
          REDIS_PASSWORD
      }            = require("../config/config");
const redis        = require('redis');
const crypto       = require('crypto');
const {fileExists} = require('../helper/validator');
const redisClient  = redis.createClient(REDIS_PORT, REDIS_URL);
redisClient.auth(REDIS_PASSWORD);
redisClient.on("error", (error) => {
    console.error(` -------> \n ${error} \n`);
});
redisClient.on('connect', function () {
    console.log(' -------> \n Cache connected \n');
});
const cacheData = (req, res, next) => {
    try {
        if (!req.query.capture || req.query.capture !== '') {
            const md5sum          = crypto.createHash('md5');
            const md5CheckSumHash = md5sum.update(req.query.capture).digest("hex");
            redisClient.get(md5CheckSumHash, (err, data) => {
                if (err) {
                    console.error(err);
                    throw err;
                }

                if (data) {
                    const captureURLValidate = Buffer.from(req.query.capture, 'base64');
                    const captureURL         = captureURLValidate.toString('utf-8');
                    const responseData       = JSON.parse(data);
                    if (!fileExists(responseData.siteName)) {
                        console.log(' \n -------> File not found, sending the request to generate the file again. \n ');
                        next();
                    } else {
                        console.log(` -------> START: \n ${captureURL} \n `);
                        console.log(' \n -------> Data retrieved from Redis \n ');
                        res.status(200).send(responseData);
                    }
                } else {
                    console.log(' \n -------> No Data Found, let\'s fish for some data! \n');
                    next();
                }
            });
        }
    } catch (err) {
        res.status(500).send({error: err.message});
    }
};
module.exports  = cacheData;
