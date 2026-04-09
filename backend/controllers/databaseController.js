const { DatabaseConnection } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const dbManager = require('../services/dbManager');

const getAll = async (req, res, next) => {
    try {
        const databases = await DatabaseConnection.findAll({
            order: [['name', 'ASC']]
        });
        
        // Censor passwords for safety, keeping only if not null
        const safeData = databases.map(db => {
            const data = db.toJSON();
            if (data.password) data.password = '********';
            return data;
        });

        res.json({ success: true, data: safeData });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, host, port, user, password, database, description, schemaGroup, isActive } = req.body;

        if (!name || !host || !user || !database) {
            throw new AppError('Nombre, host, usuario y base de datos son requeridos.', 400);
        }

        const newDb = await DatabaseConnection.create({ 
            name, host, port, user, password, database, description, schemaGroup, isActive 
        });

        const safeData = newDb.toJSON();
        if (safeData.password) safeData.password = '********';

        res.status(201).json({ success: true, data: safeData });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            next(new AppError('El nombre de la conexión ya existe', 400));
        } else {
            next(error);
        }
    }
};

const update = async (req, res, next) => {
    try {
        const { name, host, port, user, password, database, description, schemaGroup, isActive } = req.body;
        const dbConfig = await DatabaseConnection.findByPk(req.params.id);

        if (!dbConfig) {
            throw new AppError('Conexión de Base de datos no encontrada', 404);
        }

        const updateData = { name, host, port, user, database, description, schemaGroup, isActive };
        // Only update the password if a new one is provided and not the masked version
        if (password && password !== '********') {
            updateData.password = password;
        }

        await dbConfig.update(updateData);
        
        // Clear cached pool
        dbManager.removePool(dbConfig.id);

        const safeData = dbConfig.toJSON();
        if (safeData.password) safeData.password = '********';

        res.json({ success: true, data: safeData });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            next(new AppError('El nombre de la conexión ya existe', 400));
        } else {
            next(error);
        }
    }
};

const remove = async (req, res, next) => {
    try {
        const dbConfig = await DatabaseConnection.findByPk(req.params.id);
        
        if (!dbConfig) {
            throw new AppError('Conexión de base de datos no encontrada', 404);
        }

        dbManager.removePool(dbConfig.id);
        await dbConfig.destroy();

        res.json({ success: true, message: 'Conexión eliminada correctamente' });
    } catch (error) {
        next(error);
    }
};

const testConnection = async (req, res, next) => {
    try {
        const dbConfig = await DatabaseConnection.findByPk(req.params.id);
        if (!dbConfig) {
            throw new AppError('Conexión no encontrada', 404);
        }
        
        await dbManager.testConnection(dbConfig);
        
        res.json({ success: true, message: 'Conexión exitosa a la Base de Datos.' });
    } catch (error) {
        res.status(400).json({ success: false, message: `Error conectando: ${error.message}` });
    }
};

module.exports = {
    getAll,
    create,
    update,
    remove,
    testConnection
};
