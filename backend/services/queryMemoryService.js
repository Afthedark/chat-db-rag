const { QueryMemory } = require('../models');
const { Op } = require('sequelize');

/**
 * Tokeniza un texto para búsqueda de similitud
 * - Convierte a minúsculas
 * - Normaliza tildes y ñ
 * - Extrae solo palabras de 4+ caracteres
 */
const tokenize = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Minúsculas y normalización
  let normalized = text.toLowerCase();

  // Normalizar tildes: á→a, é→e, í→i, ó→o, ú→u, ñ→n
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n');

  // Extraer palabras de 4 o más caracteres
  const matches = normalized.match(/\b[a-z]{4,}\b/g);

  return matches || [];
};

/**
 * Encuentra consultas similares en el historial
 * @param {string} question - Pregunta del usuario
 * @param {number} databaseId - ID de la base de datos
 * @param {number} limit - Máximo de resultados (default: 4)
 * @returns {Array} Consultas similares con campo similarity
 */
const findSimilarQueries = async (question, databaseId, limit = 4) => {
  try {
    // Tokenizar la pregunta
    const tokens = tokenize(question);

    if (tokens.length === 0) {
      return [];
    }

    // Construir condición OR para buscar cada token
    const tokenConditions = tokens.map(token => ({
      questionText: {
        [Op.like]: `%${token}%`
      }
    }));

    // Buscar candidatos
    const candidates = await QueryMemory.findAll({
      where: {
        [Op.and]: [
          { databaseId },
          { wasSuccessful: true },
          { score: { [Op.gte]: 0.5 } },
          { [Op.or]: tokenConditions }
        ]
      },
      order: [
        ['usageCount', 'DESC'],
        ['score', 'DESC']
      ],
      limit: 20
    });

    // Calcular similitud para cada candidato
    const scoredCandidates = candidates.map(candidate => {
      const candidateTokens = candidate.questionTokens || tokenize(candidate.questionText);
      const candidateTokenSet = new Set(candidateTokens);

      // Contar tokens de la pregunta que están en el candidato
      let overlap = 0;
      for (const token of tokens) {
        if (candidateTokenSet.has(token)) {
          overlap++;
        }
      }

      // Similaridad = overlap / max(len(tokens), len(candidateTokens))
      const maxTokens = Math.max(tokens.length, candidateTokens.length);
      const similarity = maxTokens > 0 ? overlap / maxTokens : 0;

      return {
        ...candidate.toJSON(),
        similarity
      };
    });

    // Filtrar por umbral de similitud y ordenar
    const filtered = scoredCandidates
      .filter(c => c.similarity > 0.2)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return filtered;

  } catch (error) {
    console.error('❌ Error en findSimilarQueries:', error.message);
    return [];
  }
};

/**
 * Guarda una consulta exitosa en la memoria
 * @param {Object} params
 * @param {string} params.questionText - Pregunta original
 * @param {string} params.sqlQuery - SQL generado
 * @param {number} params.databaseId - ID de la base de datos
 * @param {number} params.rowsReturned - Número de filas retornadas
 */
const saveSuccessfulQuery = async ({ questionText, sqlQuery, databaseId, rowsReturned }) => {
  try {
    // Tokenizar la pregunta
    const questionTokens = tokenize(questionText);

    // Extraer tablas del SQL
    const tablesUsed = [];
    const tableRegex = /(?:FROM|JOIN)\s+(\w+)/gi;
    let match;
    while ((match = tableRegex.exec(sqlQuery)) !== null) {
      if (!tablesUsed.includes(match[1])) {
        tablesUsed.push(match[1]);
      }
    }

    // Calcular score
    const score = rowsReturned > 0 ? 1.0 : 0.4;

    // Buscar si ya existe
    const existing = await QueryMemory.findOne({
      where: {
        questionText,
        databaseId
      }
    });

    if (existing) {
      // Actualizar registro existente
      await existing.update({
        sqlQuery,
        questionTokens,
        tablesUsed,
        rowsReturned,
        score,
        usageCount: existing.usageCount + 1,
        wasSuccessful: true
      });
      console.log(`🔄 QueryMemory actualizado: "${questionText.substring(0, 50)}..."`);
    } else {
      // Crear nuevo registro
      await QueryMemory.create({
        questionText,
        questionTokens,
        sqlQuery,
        tablesUsed,
        rowsReturned,
        score,
        usageCount: 1,
        databaseId,
        wasSuccessful: true
      });
      console.log(`💾 QueryMemory creado: "${questionText.substring(0, 50)}..."`);
    }

  } catch (error) {
    console.error('❌ Error en saveSuccessfulQuery:', error.message);
    throw error;
  }
};

/**
 * Marca una consulta como fallida
 * @param {string} questionText - Pregunta que falló
 * @param {number} databaseId - ID de la base de datos
 */
const markQueryFailed = async (questionText, databaseId) => {
  try {
    await QueryMemory.update(
      {
        wasSuccessful: false,
        score: 0
      },
      {
        where: {
          questionText,
          databaseId
        }
      }
    );
    console.log(`❌ QueryMemory marcado como fallido: "${questionText.substring(0, 50)}..."`);
  } catch (error) {
    console.error('❌ Error en markQueryFailed:', error.message);
  }
};

module.exports = {
  findSimilarQueries,
  saveSuccessfulQuery,
  markQueryFailed,
  tokenize
};
