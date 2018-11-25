const express = require('express');
const AuthRoutes = require('./auth');

const router = express.Router();
router.get('/', (req, res) => res.status(403).end());
router.use('/auth', AuthRoutes);

module.exports = router;
