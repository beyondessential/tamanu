const express = require('express');
const RealmController = require('../controllers/realm');
const AuthService = require('../services/auth');

const authService = new AuthService();
const router = express.Router();
router.use(authService.authorizeRequest());
router.get('/:model/:id', authService.validatePermissions(), RealmController.GET);
router.get('/:model', authService.validatePermissions(), RealmController.GET);
router.patch('/:model/:id', authService.validatePermissions(), RealmController.PATCH);
router.put('/:model/:id', authService.validatePermissions(), RealmController.PUT);
router.put('/:model', authService.validatePermissions(), RealmController.PUT);
router.post('/:model', authService.validatePermissions(), RealmController.POST);
router.delete('/:model/:id', authService.validatePermissions(), RealmController.DELETE);

module.exports = router;
