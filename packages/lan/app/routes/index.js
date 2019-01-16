const express = require('express');
const basicAuth = require('express-basic-auth');

const RealmRoutes = require('./realm');
const AuthRoutes = require('./auth');
const { authorizer } = require('../utils');

const router = express.Router();
router.get('/', (req, res) => res.send('Hello World!'));
router.use('/auth', AuthRoutes);
router.use('/realm', basicAuth({
  authorizer,
  authorizeAsync: true,
  unauthorizedResponse: () => 'Invalid credentials'
}), RealmRoutes);

module.exports = router;
