const express = require('express');

const SubscriptionRoutes = require('./subscription');

const router = express.Router();
router.use('/subscription', SubscriptionRoutes);

module.exports = router;
