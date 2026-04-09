const express = require('express');
const router = express.Router();
const queryMemoryController = require('../controllers/queryMemoryController');

// GET /api/query-memory - Listar consultas guardadas
router.get('/', queryMemoryController.getAll);

// POST /api/query-memory - Crear nuevo ejemplo
router.post('/', queryMemoryController.create);

// PUT /api/query-memory/:id - Editar ejemplo
router.put('/:id', queryMemoryController.update);

// DELETE /api/query-memory/:id - Eliminar ejemplo
router.delete('/:id', queryMemoryController.remove);

// POST /api/query-memory/test - Probar SQL sin guardar
router.post('/test', queryMemoryController.testSQL);

// POST /api/query-memory/generate - Generar SQL con IA
router.post('/generate', queryMemoryController.generateSQL);

module.exports = router;
