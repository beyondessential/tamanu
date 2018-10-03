const express = require('express');
const RealmRoutes = require('./realm');

const router = express.Router();
router.get('/', (req, res) => res.send('Hello World!'));
router.use('/realm', RealmRoutes);

module.exports = router;
