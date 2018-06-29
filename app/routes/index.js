const express = require('express');
const SubscriptionRoutes = require('./subscription');
const forwardCouch = require('../middleware/forwardCouch');

const router = express.Router();
router.get('/', (req, res) => res.send('Hello World!'));
router.use('/subscription', SubscriptionRoutes);
router.use('/couchProxy', forwardCouch);

module.exports = router;
