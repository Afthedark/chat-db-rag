const express = require('express');
const router = express.Router();
const rulesController = require('../controllers/rulesController');

router.get('/', rulesController.getAll);
router.get('/:id', rulesController.getById);
router.post('/', rulesController.create);
router.put('/:id', rulesController.update);
router.delete('/:id', rulesController.remove);

module.exports = router;
