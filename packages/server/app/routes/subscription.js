const express = require('express');
const SubscriptionController = require('../controllers/subscription');

const router = express.Router();
router.post('/', SubscriptionController.saveSubscription);
router.put('/:id', SubscriptionController.updateSubscription);

module.exports = router;
