const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');

router.get('/', databaseController.getAll);
router.post('/', databaseController.create);
router.put('/:id', databaseController.update);
router.delete('/:id', databaseController.remove);
router.post('/:id/test', databaseController.testConnection);

module.exports = router;
