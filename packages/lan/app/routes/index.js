const express = require('express');
const RealmRoutes = require('./realm');
const AuthRoutes = require('./auth');

const router = express.Router();
router.get('/', (req, res) => res.send('Tamanu Lan Server'));
router.use('/auth', AuthRoutes);
router.use('/realm', RealmRoutes);

module.exports = router;
