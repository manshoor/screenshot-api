'use strict';
const express        = require('express');
const authController = require("../controllers/chromeController");
const protect        = require("../middleware/authMiddleware");
const cachedData     = require("../middleware/redis-cache");
// const limiter        = require("../middleware/rate-limiter");

const router = express.Router();

router
    .route('/')
    .get(protect, cachedData, authController.screenshot)
    .get(authController.screenshot);
module.exports = router;
