/**
 * Memory Manager Service
 * Handles intelligent context management, caching, summarization, and preferences
 */

const crypto = require('crypto');
const { Op } = require('sequelize');
const { SQLCache, UserPreference, Message, ContextRule, sequelize } = require('../models');
const embeddingService = require('./embeddingService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate hash from question text
 */
const hashQuestion = (question) => {
    return crypto.createHash('md5').update(question.toLowerCase().trim()).digest('hex');
};

/**
 * Check SQL cache for similar questions
 * @param {string} question - User question
 * @param {number} databaseId - Target database ID
 * @returns {Promise<Object|null>} - Cached SQL entry or null
 */
const checkSQLCache = async (question, databaseId) => {
    try {
        const questionHash = hashQuestion(question);
        
        // First try exact hash match
        const exactMatch = await SQLCache.findOne({
            where: {
                questionHash,
                databaseId
            },
            order: [['useCount', 'DESC']]
        });
        
        if (exactMatch) {
            // Increment use count
            await exactMatch.increment('useCount');
            exactMatch.lastUsed = new Date();
            await exactMatch.save();
            
            console.log(`⚡ SQL Cache HIT (exact): ${question.substring(0, 50)}...`);
            return exactMatch;
        }
        
        // Try similarity search
        const recentCache = await SQLCache.findAll({
            where: {
                databaseId,
                useCount: { [Op.gte]: 2 } // Only consider entries used at least twice
            },
            order: [['useCount', 'DESC']],
            limit: 50
        });
        
        const similarQuestions = embeddingService.findSimilarQuestions(question, recentCache, 0.5);
        
        if (similarQuestions.length > 0) {
            const best = similarQuestions[0];
            console.log(`⚡ SQL Cache HIT (similarity ${best.similarity.toFixed(2)}): ${question.substring(0, 50)}...`);
            
            // Update the cache entry
            await SQLCache.update(
                { useCount: best.useCount + 1, lastUsed: new Date() },
                { where: { id: best.id } }
            );
            
            return best;
        }
        
        console.log(`🔍 SQL Cache MISS: ${question.substring(0, 50)}...`);
        return null;
    } catch (error) {
        console.error('Error checking SQL cache:', error.message);
        return null; // Fail gracefully, proceed without cache
    }
};

/**
 * Save SQL to cache
 */
const saveToSQLCache = async (question, sqlQuery, databaseId, resultPreview = null) => {
    try {
        const questionHash = hashQuestion(question);
        const preview = resultPreview ? JSON.stringify(resultPreview).substring(0, 500) : null;
        
        await SQLCache.create({
            questionHash,
            question,
            sqlQuery,
            databaseId,
            resultPreview: preview
        });
        
        console.log(`💾 SQL Cache SAVE: ${question.substring(0, 50)}...`);
    } catch (error) {
        console.error('Error saving to SQL cache:', error.message);
        // Don't throw - cache save failures shouldn't break the flow
    }
};

/**
 * Get or create user preference
 */
const getPreference = async (key) => {
    try {
        const pref = await UserPreference.findOne({
            where: { preferenceKey: key }
        });
        return pref ? JSON.parse(pref.value) : null;
    } catch (error) {
        console.error('Error getting preference:', error.message);
        return null;
    }
};

/**
 * Set user preference
 */
const setPreference = async (key, category, value, confidence = 0.5) => {
    try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        const [pref, created] = await UserPreference.findOrCreate({
            where: { preferenceKey: key },
            defaults: {
                category,
                value: stringValue,
                confidence
            }
        });
        
        if (!created) {
            await pref.update({
                value: stringValue,
                frequency: pref.frequency + 1,
                lastUpdated: new Date(),
                confidence: Math.min(1, pref.confidence + 0.1)
            });
        }
        
        console.log(`🎯 Preference SET: ${key}`);
    } catch (error) {
        console.error('Error setting preference:', error.message);
    }
};

/**
 * Infer preferences from conversation patterns
 */
const inferPreferences = async (chatId, question, sqlGenerated) => {
    try {
        // Infer database preference
        const messages = await Message.findAll({
            where: { chatId },
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        // Check for repeated patterns
        const questions = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
        const commonKeywords = questions.map(q => embeddingService.extractKeywords(q)).flat();
        
        const keywordCounts = {};
        commonKeywords.forEach(kw => {
            keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        });
        
        const frequentKeywords = Object.entries(keywordCounts)
            .filter(([_, count]) => count >= 3)
            .map(([kw]) => kw);
        
        if (frequentKeywords.length > 0) {
            await setPreference(
                `chat_${chatId}_interests`,
                'query',
                { keywords: frequentKeywords, inferredFrom: 'pattern_analysis' },
                0.7
            );
        }
    } catch (error) {
        console.error('Error inferring preferences:', error.message);
    }
};

/**
 * Smart context rule retrieval based on keywords
 */
const getSmartContextRules = async (question, categories = ['INSTRUCCIONES', 'EJEMPLOS_SQL']) => {
    try {
        const keywords = embeddingService.extractKeywords(question);

        if (keywords.length === 0) {
            // Fallback to all active rules
            return await ContextRule.findAll({
                where: {
                    isActive: true,
                    category: categories
                },
                order: [['priority', 'DESC']]
            });
        }

        // Find rules with matching keywords OR rules without keywords (legacy rules)
        const rules = await ContextRule.findAll({
            where: {
                isActive: true,
                category: categories,
                [Op.or]: [
                    // Rules with matching keywords
                    ...keywords.map(kw => ({
                        keywords: { [Op.like]: `%${kw}%` }
                    })),
                    // Rules without keywords (legacy) - always include them
                    { keywords: null },
                    { keywords: '' }
                ]
            },
            order: [
                ['priority', 'DESC'],
                ['matchCount', 'DESC']
            ]
        });
        
        // Increment match count for matched rules
        for (const rule of rules) {
            await rule.increment('matchCount');
        }
        
        console.log(`🎯 Smart Context: Retrieved ${rules.length} rules for keywords: ${keywords.join(', ')}`);
        return rules;
    } catch (error) {
        console.error('Error getting smart context rules:', error.message);
        // Fallback to basic retrieval
        return await ContextRule.findAll({
            where: {
                isActive: true,
                category: categories
            }
        });
    }
};

/**
 * Summarize conversation history when it gets too long
 * @param {Array} messages - Array of Message objects
 * @param {number} threshold - Message count threshold
 * @returns {Promise<Object>} - Summary object with compressed context
 */
const summarizeConversation = async (messages, threshold = 15) => {
    if (messages.length < threshold) {
        return null; // No summarization needed
    }
    
    try {
        // Keep most recent messages intact
        const recentMessages = messages.slice(-10);
        const olderMessages = messages.slice(0, -10);
        
        // Extract key information from older messages
        const keyPoints = {
            databasesQueried: [...new Set(olderMessages.filter(m => m.databaseUsed).map(m => m.databaseUsed))],
            sqlQueriesExecuted: olderMessages.filter(m => m.sqlExecuted).length,
            userQuestions: olderMessages.filter(m => m.role === 'user').slice(-5).map(m => m.content.substring(0, 100)),
            topicsDiscussed: embeddingService.extractKeywords(
                olderMessages.filter(m => m.role === 'user').map(m => m.content).join(' ')
            ).slice(0, 10)
        };
        
        console.log(`📝 Conversation Summarized: ${olderMessages.length} older messages compressed`);
        
        return {
            summary: keyPoints,
            recentMessages,
            totalMessages: messages.length,
            compressed: true
        };
    } catch (error) {
        console.error('Error summarizing conversation:', error.message);
        return null;
    }
};

/**
 * Get dynamic history limit based on conversation context
 */
const getDynamicHistoryLimit = (messageCount, intent) => {
    const baseLimit = intent === 'DATABASE' ? 10 : 20;
    
    // Scale based on conversation length
    if (messageCount > 50) return Math.min(baseLimit + 5, 30);
    if (messageCount > 30) return Math.min(baseLimit + 3, 25);
    if (messageCount > 15) return baseLimit;
    
    return Math.min(baseLimit, messageCount);
};

/**
 * Clean old cache entries (utility function)
 */
const cleanOldCache = async (daysOld = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const deleted = await SQLCache.destroy({
            where: {
                lastUsed: { [Op.lt]: cutoffDate },
                useCount: { [Op.lt]: 5 } // Keep frequently used entries
            }
        });
        
        console.log(`🧹 Cache Cleanup: Removed ${deleted} old entries`);
        return deleted;
    } catch (error) {
        console.error('Error cleaning cache:', error.message);
        return 0;
    }
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
    try {
        const totalEntries = await SQLCache.count();
        const totalUses = await SQLCache.sum('useCount');
        const avgSimilarity = await SQLCache.findOne({
            attributes: [[sequelize.fn('AVG', sequelize.col('similarityScore')), 'avgSimilarity']],
            where: { similarityScore: { [Op.ne]: null } }
        });
        
        return {
            totalEntries,
            totalUses: totalUses || 0,
            avgSimilarity: avgSimilarity?.dataValues?.avgSimilarity || 0,
            hitRate: totalEntries > 0 ? ((totalUses - totalEntries) / totalUses * 100).toFixed(2) : 0
        };
    } catch (error) {
        console.error('Error getting cache stats:', error.message);
        return { totalEntries: 0, totalUses: 0, avgSimilarity: 0, hitRate: 0 };
    }
};

module.exports = {
    checkSQLCache,
    saveToSQLCache,
    getPreference,
    setPreference,
    inferPreferences,
    getSmartContextRules,
    summarizeConversation,
    getDynamicHistoryLimit,
    cleanOldCache,
    getCacheStats
};
