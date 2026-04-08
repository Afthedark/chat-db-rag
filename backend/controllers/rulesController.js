const { ContextRule } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const getAll = async (req, res, next) => {
    try {
        const { category } = req.query;
        let whereClause = {};
        if (category) {
            whereClause.category = category;
        }

        const rules = await ContextRule.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
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
        const { key, category, content, isActive } = req.body;
        
        if (!key || !category || !content) {
            throw new AppError('Key, category y content son obligatorios', 400);
        }

        const newRule = await ContextRule.create({ key, category, content, isActive });
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
        const { key, category, content, isActive } = req.body;
        const rule = await ContextRule.findByPk(req.params.id);
        
        if (!rule) {
            throw new AppError('Regla no encontrada', 404);
        }

        await rule.update({ key, category, content, isActive });
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

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
