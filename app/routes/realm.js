const express = require('express');
const RealmController = require('../controllers/realm');

const router = express.Router();
router.get('/:model/:id', RealmController.GET);
router.get('/:model', RealmController.GET);
router.put('/:model/:id', RealmController.PUT);
router.put('/:model', RealmController.PUT);
router.post('/:model', RealmController.POST);
router.delete('/:model/:id', RealmController.DELETE);

module.exports = router;
