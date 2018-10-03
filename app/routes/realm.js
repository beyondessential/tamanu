const express = require('express');
const RealmController = require('../controllers/realm');

const router = express.Router();
router.get('*', RealmController.GET);
router.put('*', RealmController.PUT);
router.post('*', RealmController.POST);
router.delete('*', RealmController.DELETE);

module.exports = router;
