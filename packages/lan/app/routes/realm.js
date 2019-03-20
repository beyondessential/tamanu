import express from 'express';
import RealmController from '../controllers/realm';
import AuthService from '../services/auth';

const authorizeRequest = (req, res, next) => {
  const database = req.app.get('database');
  const authService = new AuthService(database);
  return authService.authorizeRequest(req, res, next);
};

const validatePermissions = (req, res, next) => {
  const database = req.app.get('database');
  const authService = new AuthService(database);
  return authService.validateRequestPermissions(req, res, next);
};

const router = express.Router();
router.use(authorizeRequest);
router.get('/:model/:id', validatePermissions, RealmController.GET);
router.get('/:model', validatePermissions, RealmController.GET);
router.patch('/:model/:id', validatePermissions, RealmController.PATCH);
router.put('/:model/:id', validatePermissions, RealmController.PUT);
router.put('/:model', validatePermissions, RealmController.PUT);
router.post('/:model', validatePermissions, RealmController.POST);
router.delete('/:model/:id', validatePermissions, RealmController.DELETE);

export default router;
