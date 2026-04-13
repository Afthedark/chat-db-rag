const { ContextRule } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const embeddingService = require('../services/embeddingService');

/**
 * Auto-generate keywords from content if not provided
 */
const autoGenerateKeywords = (content) => {
    if (!content) return '';
    const keywords = embeddingService.extractKeywords(content);
    // Take top 15 unique keywords, join with commas
    return [...new Set(keywords)].slice(0, 15).join(',');
};

const getAll = async (req, res, next) => {
    try {
        const { category, isActive, sortBy } = req.query;
        let whereClause = {};
        if (category) {
            whereClause.category = category;
        }
        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }

        // Default sort by priority and matchCount
        const orderField = sortBy === 'matchCount' ? ['matchCount', 'DESC'] :
                          sortBy === 'priority' ? ['priority', 'DESC'] :
                          ['createdAt', 'DESC'];

        const rules = await ContextRule.findAll({
            where: whereClause,
            order: [orderField]
        });

        res.json({ success: true, data: rules });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const rule = await ContextRule.findByPk(req.params.id);
        if (!rule) {
            throw new AppError('Regla no encontrada', 404);
        }
        res.json({ success: true, data: rule });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { key, category, content, isActive, keywords, priority } = req.body;

        if (!key || !category || !content) {
            throw new AppError('Key, category y content son obligatorios', 400);
        }

        // Auto-generate keywords from content if not provided
        const finalKeywords = keywords && keywords.trim() 
            ? keywords 
            : autoGenerateKeywords(content);

        const newRule = await ContextRule.create({
            key,
            category,
            content,
            isActive: isActive !== undefined ? isActive : true,
            keywords: finalKeywords,
            priority: priority || 0
        });
        res.status(201).json({ success: true, data: newRule });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            next(new AppError('El identificador (key) ya existe', 400));
        } else {
            next(error);
        }
    }
};

const update = async (req, res, next) => {
    try {
        const { key, category, content, isActive, keywords, priority } = req.body;
        const rule = await ContextRule.findByPk(req.params.id);

        if (!rule) {
            throw new AppError('Regla no encontrada', 404);
        }

        // Auto-generate keywords if content changed and no keywords provided
        const finalKeywords = keywords && keywords.trim()
            ? keywords
            : (content && content !== rule.content)
                ? autoGenerateKeywords(content)
                : rule.keywords;

        await rule.update({
            key,
            category,
            content,
            isActive,
            keywords: finalKeywords,
            priority: priority !== undefined ? priority : rule.priority
        });
        res.json({ success: true, data: rule });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            next(new AppError('El identificador (key) ya existe', 400));
        } else {
            next(error);
        }
    }
};

const remove = async (req, res, next) => {
    try {
        const rule = await ContextRule.findByPk(req.params.id);
        if (!rule) {
            throw new AppError('Regla no encontrada', 404);
        }

        await rule.destroy();
        res.json({ success: true, message: 'Regla eliminada' });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/rules/:id/populate-keywords
 * Auto-generate keywords for existing rule
 */
const populateKeywords = async (req, res, next) => {
    try {
        const rule = await ContextRule.findByPk(req.params.id);
        if (!rule) {
            throw new AppError('Regla no encontrada', 404);
        }

        if (rule.keywords && rule.keywords.trim()) {
            return res.json({ 
                success: true, 
                message: 'Rule already has keywords',
                keywords: rule.keywords
            });
        }

        const autoKeywords = autoGenerateKeywords(rule.content);
        await rule.update({ keywords: autoKeywords });

        res.json({ 
            success: true, 
            message: 'Keywords generated successfully',
            keywords: autoKeywords
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/rules/populate-all-keywords
 * Auto-generate keywords for ALL rules missing them
 */
const populateAllKeywords = async (req, res, next) => {
    try {
        const rules = await ContextRule.findAll({
            where: {
                [Op.or]: [
                    { keywords: null },
                    { keywords: '' }
                ]
            }
        });

        let updated = 0;
        for (const rule of rules) {
            const autoKeywords = autoGenerateKeywords(rule.content);
            if (autoKeywords) {
                await rule.update({ keywords: autoKeywords });
                updated++;
                console.log(`  ✓ Generated keywords for "${rule.key}": ${autoKeywords}`);
            }
        }

        res.json({ 
            success: true, 
            message: `Keywords generated for ${updated} rules`,
            updated
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    populateKeywords,
    populateAllKeywords
};
