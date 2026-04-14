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

// Character budgets per category for LLM context optimization
const RULE_BUDGETS = {
    INSTRUCCIONES: { maxRules: 5, maxChars: 2500 },
    EJEMPLOS_SQL: { maxRules: 5, maxChars: 3500 }
};

const getSmartContextRules = async (question, categories = ['INSTRUCCIONES', 'EJEMPLOS_SQL']) => {
    try {
        const keywords = embeddingService.extractKeywords(question);

        let allRules;
        if (keywords.length === 0) {
            // Fallback to all active rules but with limits
            allRules = await ContextRule.findAll({
                where: {
                    isActive: true,
                    category: categories
                },
                order: [['priority', 'DESC']]
            });
        } else {
            // Filter keywords for content matching (only meaningful ones, length > 3)
            const contentKeywords = keywords.filter(kw => kw.length > 3);
            
            allRules = await ContextRule.findAll({
                where: {
                    isActive: true,
                    category: categories,
                    [Op.or]: [
                        // Rules with matching keywords field
                        ...keywords.map(kw => ({
                            keywords: { [Op.like]: `%${kw}%` }
                        })),
                        // ALSO match rules whose CONTENT contains meaningful keywords
                        ...(contentKeywords.length > 0 ? contentKeywords.map(kw => ({
                            content: { [Op.like]: `%${kw}%` }
                        })) : []),
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
        }

        // Apply per-category limits and character budgets
        const limitedRules = [];
        const debugInfo = {};
        const originalRulesForIncrement = []; // Track original Sequelize instances

        for (const cat of categories) {
            const budget = RULE_BUDGETS[cat] || { maxRules: 5, maxChars: 3000 };
            const catRules = allRules.filter(r => r.category === cat);
            
            let selectedRules = [];
            let totalChars = 0;

            for (const rule of catRules) {
                if (selectedRules.length >= budget.maxRules) break;
                
                const remainingBudget = budget.maxChars - totalChars;
                
                if (remainingBudget <= 0) break;
                
                if (rule.content.length > remainingBudget) {
                    // TRUNCATE the rule to fit instead of skipping it entirely
                    // This ensures at least partial content is included
                    const truncatedRule = { ...rule.toJSON ? rule.toJSON() : rule };
                    truncatedRule.content = rule.content.substring(0, remainingBudget);
                    selectedRules.push(truncatedRule);
                    totalChars += truncatedRule.content.length;
                    console.log(`   ⚠️ ${cat}: Rule "${rule.key || 'unknown'}" truncated from ${rule.content.length} to ${truncatedRule.content.length} chars`);
                    // Still track original for increment
                    originalRulesForIncrement.push(rule);
                    break; // No more budget after truncation
                } else {
                    selectedRules.push(rule);
                    originalRulesForIncrement.push(rule);
                    totalChars += rule.content.length;
                }
            }

            limitedRules.push(...selectedRules);
            debugInfo[cat] = { total: catRules.length, selected: selectedRules.length, chars: totalChars };
        }
        
        // Increment match count for selected rules only (use original Sequelize instances)
        for (const rule of originalRulesForIncrement) {
            try {
                await rule.increment('matchCount');
            } catch (incError) {
                console.warn(`   ⚠️ Could not increment matchCount for rule "${rule.key || 'unknown'}":`, incError.message);
            }
        }
        
        console.log(`🎯 Smart Context Rules Budget:`);
        for (const [cat, info] of Object.entries(debugInfo)) {
            console.log(`   ${cat}: ${info.selected}/${info.total} rules, ${info.chars} chars`);
        }
        console.log(`   Keywords: ${keywords.length > 0 ? keywords.join(', ') : '(none - fallback mode)'}`);
        
        return limitedRules;
    } catch (error) {
        console.error('Error getting smart context rules:', error.message);
        // Fallback with limits
        const fallbackRules = await ContextRule.findAll({
            where: {
                isActive: true,
                category: categories
            },
            order: [['priority', 'DESC']],
            limit: 8 // Hard safety limit on fallback
        });
        return fallbackRules;
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
