const {APP_SECRET} = require("../config/config");
console.log(APP_SECRET);
const protect = (req, res, next) => {
  if (!req.query.apikey || req.query.apikey !== APP_SECRET) {
    return res.status(403).send('Secret key is missing or incorrect');
  }
  next();
};
module.exports = protect;
