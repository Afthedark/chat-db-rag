const OpenAI = require('openai');
const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');
require('dotenv').config();

const generateResponse = async (messages) => {
    const provider = process.env.AI_PROVIDER || 'ollama';

    try {
        if (provider === 'openrouter') {
            const openai = new OpenAI({
                baseURL: 'https://openrouter.ai/api/v1',
                apiKey: process.env.OPENROUTER_API_KEY,
                defaultHeaders: {
                    'HTTP-Referer': 'http://localhost:3000', 
                    'X-OpenRouter-Title': 'Chat DB RAG', 
                },
            });

            const completion = await openai.chat.completions.create({
                model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-70b-instruct',
                messages: messages,
            });

            if (completion && completion.choices && completion.choices.length > 0) {
                return completion.choices[0].message.content;
            } else {
                throw new AppError('Respuesta inesperada de OpenRouter', 500);
            }
        } else if (provider === 'ollama') {
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
            const response = await axios.post(
                ollamaUrl,
                {
                    model: process.env.OLLAMA_MODEL || 'llama3',
                    messages: messages,
                    stream: false,
                    options: {
                        num_ctx: parseInt(process.env.OLLAMA_NUM_CTX) || 8192,
                        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.1,
                        num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT) || 500,
                        top_p: 0.9,
                        repeat_penalty: 1.1
                    }
                },
                { timeout: 120000 }
            );

            if (response.data && response.data.message) {
                return response.data.message.content;
            } else {
                throw new AppError('Respuesta inesperada de Ollama', 500);
            }
        } else {
            throw new AppError(`Proveedor IA no soportado: ${provider}`, 400);
        }
    } catch (error) {
        console.error(`Error en AI Service (${provider}):`, error.message);
        throw new AppError(`Error generando respuesta desde ${provider}: ${error.message}`, 500);
    }
};

module.exports = {
    generateResponse
};
