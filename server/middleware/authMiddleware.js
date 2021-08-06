const {APP_SECRET} = require("../config/config");
const protect = (req, res, next) => {
  console.log(req.query.secretKey);
  console.log(APP_SECRET);
  if (!req.query.apikey || req.query.apikey !== APP_SECRET) {
    return res.status(403).send('Secret key is missing or incorrect' + APP_SECRET);
  }
  next();
};
module.exports = protect;
