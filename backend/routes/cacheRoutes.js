const express = require('express');
const router = express.Router();
const memoryManager = require('../services/memoryManager');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
const getCacheStats = async (req, res, next) => {
    try {
        const stats = await memoryManager.getCacheStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/cache/clean
 * Clean old cache entries
 */
const cleanCache = async (req, res, next) => {
    try {
        const { daysOld } = req.body;
        const deleted = await memoryManager.cleanOldCache(daysOld || 30);
        res.json({ 
            success: true, 
            message: `Removed ${deleted} old cache entries`,
            deleted 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/cache/search
 * Search cache by question similarity
 */
const searchCache = async (req, res, next) => {
    try {
        const { question, databaseId, threshold } = req.query;
        
        if (!question || !databaseId) {
            throw new AppError('question and databaseId are required', 400);
        }
        
        const { SQLCache } = require('../models');
        const cacheEntries = await SQLCache.findAll({
            where: { databaseId: parseInt(databaseId) },
            limit: 50
        });
        
        const similar = memoryManager.findSimilarQuestions(
            question, 
            cacheEntries, 
            parseFloat(threshold) || 0.3
        );
        
        res.json({ 
            success: true, 
            data: similar.slice(0, 10),
            count: similar.length
        });
    } catch (error) {
        next(error);
    }
};

router.get('/stats', getCacheStats);
router.post('/clean', cleanCache);
router.get('/search', searchCache);

module.exports = router;
