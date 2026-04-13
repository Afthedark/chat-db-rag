const express = require('express');
const router = express.Router();
const rulesController = require('../controllers/rulesController');

router.get('/', rulesController.getAll);
router.get('/:id', rulesController.getById);
router.post('/', rulesController.create);
router.put('/:id', rulesController.update);
router.delete('/:id', rulesController.remove);

// NEW: Auto-generate keywords endpoints
router.post('/:id/populate-keywords', rulesController.populateKeywords);
router.post('/populate-all-keywords', rulesController.populateAllKeywords);

module.exports = router;
