const express = require('express');
const RealmController = require('../controllers/realm');
const AuthService = require('../services/auth');

const authService = new AuthService();
const router = express.Router();
router.use(authService.authorizeRequest());
router.get('/:model/:id', authService.validateRequestPermissions(), RealmController.GET);
router.get('/:model', authService.validateRequestPermissions(), RealmController.GET);
router.patch('/:model/:id', authService.validateRequestPermissions(), RealmController.PATCH);
router.put('/:model/:id', authService.validateRequestPermissions(), RealmController.PUT);
router.put('/:model', authService.validateRequestPermissions(), RealmController.PUT);
router.post('/:model', authService.validateRequestPermissions(), RealmController.POST);
router.delete('/:model/:id', authService.validateRequestPermissions(), RealmController.DELETE);

module.exports = router;
