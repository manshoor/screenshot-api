'use strict';
const express        = require('express');
const authController = require("../controllers/chromeController");
const protect        = require("../middleware/authMiddleware");

const router = express.Router();

router
    .route('/')
    .get(protect, authController.screenshot)
    .get(authController.screenshot)
module.exports = router;
