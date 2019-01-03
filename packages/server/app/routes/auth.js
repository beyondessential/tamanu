const express = require('express');
const AuthController = require('../controllers/auth');

const router = express.Router();
router.post('/login', AuthController.login);
router.post('/verify-credentials', AuthController.verifyCredentials);

module.exports = router;
