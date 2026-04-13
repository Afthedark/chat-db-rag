const express = require('express');
const router = express.Router();
const memoryManager = require('../services/memoryManager');
const { UserPreference } = require('../models');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/preferences
 * Get all preferences or filter by category
 */
const getAllPreferences = async (req, res, next) => {
    try {
        const { category } = req.query;
        const whereClause = {};
        if (category) {
            whereClause.category = category;
        }

        const preferences = await UserPreference.findAll({
            where: whereClause,
            order: [['frequency', 'DESC']]
        });

        res.json({ success: true, data: preferences });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/preferences/:key
 * Get specific preference by key
 */
const getPreference = async (req, res, next) => {
    try {
        const pref = await memoryManager.getPreference(req.params.key);
        
        if (!pref) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: pref });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/preferences
 * Create or update preference
 */
const setPreference = async (req, res, next) => {
    try {
        const { key, category, value, confidence } = req.body;

        if (!key || !category || value === undefined) {
            throw new AppError('key, category, and value are required', 400);
        }

        await memoryManager.setPreference(key, category, value, confidence || 0.5);

        res.json({ 
            success: true, 
            message: `Preference '${key}' saved successfully` 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/preferences/:key
 * Delete preference
 */
const deletePreference = async (req, res, next) => {
    try {
        const pref = await UserPreference.findOne({
            where: { preferenceKey: req.params.key }
        });

        if (!pref) {
            throw new AppError('Preference not found', 404);
        }

        await pref.destroy();

        res.json({ 
            success: true, 
            message: `Preference '${req.params.key}' deleted` 
        });
    } catch (error) {
        next(error);
    }
};

router.get('/', getAllPreferences);
router.get('/:key', getPreference);
router.post('/', setPreference);
router.delete('/:key', deletePreference);

module.exports = router;
