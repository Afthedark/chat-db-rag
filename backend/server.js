const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const { errorHandler } = require('./middleware/errorHandler');

const chatRoutes = require('./routes/chatRoutes');
const rulesRoutes = require('./routes/rulesRoutes');
const databaseRoutes = require('./routes/databaseRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Main App Router API
app.use('/api/chat', chatRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/databases', databaseRoutes);

// Frontend static serving
app.use(express.static(path.join(__dirname, '../frontend')));

// --- MPA Page Routes ---
app.get('/admin/rules', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/rules.html'));
});

app.get('/admin/databases', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/databases.html'));
});

app.get('/api/system/info', (req, res) => {
    res.json({
        success: true,
        aiProvider: process.env.AI_PROVIDER || 'ollama',
        model: process.env.AI_PROVIDER === 'openrouter' ? process.env.OPENROUTER_MODEL : process.env.OLLAMA_MODEL
    });
});

// -----------------------

// Error handling at the end of the chain
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

sequelize.sync()
    .then(() => {
        console.log('📦 Base de datos de memoria sincronizada exitosamente.');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Error sincronizando la base de datos de memoria:', err);
    });

// Handle elegant exit
process.on('SIGINT', async () => {
    const { closeAll } = require('./services/dbManager');
    await closeAll();
    console.log('\n😴 Pools de conexiones cerradas, finalizando el aplicativo.');
    process.exit(0);
});
