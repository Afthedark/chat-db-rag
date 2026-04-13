/**
 * Embedding Service for Semantic Memory
 * Generates and manages vector embeddings for questions, SQL queries, and context
 * Uses lightweight local embeddings (no external API required)
 */

const crypto = require('crypto');

/**
 * Generate a simple hash-based embedding for text
 * This is a lightweight approximation - for production, use OpenAI embeddings or similar
 * @param {string} text - Text to embed
 * @returns {number[]} - Vector representation (64 dimensions)
 */
const generateSimpleEmbedding = (text) => {
    if (!text) return new Array(64).fill(0);
    
    const hash = crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
    const embedding = [];
    
    // Convert hash to 64-dimensional vector
    for (let i = 0; i < 64; i++) {
        const charCode = parseInt(hash.substring(i % hash.length, (i % hash.length) + 1), 16);
        embedding.push(charCode / 16); // Normalize to 0-1
    }
    
    return embedding;
};

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score (0-1)
 */
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
};

/**
 * Calculate text similarity using multiple heuristics
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} - Similarity score (0-1)
 */
const calculateTextSimilarity = (text1, text2) => {
    if (!text1 || !text2) return 0;
    
    const t1 = text1.toLowerCase().trim();
    const t2 = text2.toLowerCase().trim();
    
    // Exact match
    if (t1 === t2) return 1.0;
    
    // Word overlap (Jaccard similarity)
    const words1 = new Set(t1.split(/\s+/));
    const words2 = new Set(t2.split(/\s+/));
    
    let intersection = 0;
    for (const word of words1) {
        if (words2.has(word)) intersection++;
    }
    
    const union = new Set([...words1, ...words2]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    
    // Keyword overlap (important words)
    const stopWords = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'en', 'por', 'para', 'con', 'sin', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or']);
    const keywords1 = [...words1].filter(w => w.length > 2 && !stopWords.has(w));
    const keywords2 = [...words2].filter(w => w.length > 2 && !stopWords.has(w));
    
    let keywordMatches = 0;
    for (const kw of keywords1) {
        if (keywords2.some(k2 => k2.includes(kw) || kw.includes(k2))) {
            keywordMatches++;
        }
    }
    
    const keywordScore = keywords1.length > 0 ? keywordMatches / keywords1.length : 0;
    
    // Weighted combination
    return (jaccard * 0.4) + (keywordScore * 0.6);
};

/**
 * Find similar questions from cache
 * @param {string} question - Current question
 * @param {Array} cacheEntries - Array of SQLCache entries
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Array} - Sorted similar entries
 */
const findSimilarQuestions = (question, cacheEntries, threshold = 0.3) => {
    const questionEmbedding = generateSimpleEmbedding(question);
    
    const scored = cacheEntries.map(entry => {
        const similarity = calculateTextSimilarity(question, entry.question);
        return { ...entry.toJSON ? entry.toJSON() : entry, similarity };
    });
    
    // Filter by threshold and sort by similarity
    return scored
        .filter(entry => entry.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity);
};

/**
 * Extract keywords from text
 * @param {string} text - Input text
 * @returns {string[]} - Array of keywords
 */
const extractKeywords = (text) => {
    if (!text) return [];
    
    const stopWords = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'en', 'por', 'para', 'con', 'sin', 'se', 'su', 'es', 'son', 'tiene', 'hay',
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'has', 'have', 'had', 'been', 'be', 'do', 'does', 'did',
        'que', 'cuanto', 'cuantos', 'cuantas', 'cual', 'cuales', 'donde', 'quien', 'como', 'cuando', 'mostrame', 'muestrame', 'dime', 'necesito', 'quiero', 'total', 'todas'
    ]);
    
    return text.toLowerCase()
        .replace(/[?¿!.,;:()]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
};

module.exports = {
    generateSimpleEmbedding,
    cosineSimilarity,
    calculateTextSimilarity,
    findSimilarQuestions,
    extractKeywords
};
