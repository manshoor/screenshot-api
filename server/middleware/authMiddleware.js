const {APP_SECRET} = require("../config/config");
const protect      = (req, res, next) => {
    if (!req.query.apikey || req.query.apikey !== APP_SECRET) {
        return res.status(403).send({status: 'fail', msg: 'Secret key is missing or incorrect'});
    }
    next();
};
module.exports     = protect;
