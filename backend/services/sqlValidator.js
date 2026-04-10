const validate = (sql) => {
    if (!sql || typeof sql !== 'string') {
        return { isValid: false, cleanSQL: '', error: 'SQL vacío o inválido.' };
    }

    // 1. Limpieza general
    let cleanSQL = sql.trim();
    
    // Quitar markdown backticks si la IA los incluye
    cleanSQL = cleanSQL.replace(/^```sql/i, '');
    cleanSQL = cleanSQL.replace(/```$/i, '');
    cleanSQL = cleanSQL.trim();

    const upperSQL = cleanSQL.toUpperCase();

    // 2. Whitelist estricta de statements
    const allowedStarts = ['SELECT', 'SHOW', 'DESCRIBE', 'WITH'];
    const startsWithAllowed = allowedStarts.some(cmd => upperSQL.startsWith(cmd));
    
    if (!startsWithAllowed) {
        return { 
            isValid: false, 
            cleanSQL: '', 
            error: 'Solo se permiten consultas de lectura (SELECT, SHOW, DESCRIBE).' 
        };
    }

    // 3. Blacklist de palabras reservadas peligrosas
    const blacklist = [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
        'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 
        'INTO OUTFILE', 'INTO DUMPFILE', 'LOAD_FILE'
    ];

    for (const word of blacklist) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(cleanSQL)) {
            return { 
                isValid: false, 
                cleanSQL: '', 
                error: `Operación bloqueada por seguridad. Se detectó comando prohibido: ${word}.` 
            };
        }
    }

    // 4. Anti-inyección de base (múltiples statements)
    // Buscamos ; seguido de texto activo para evitar "SELECT * FROM X; DELETE FROM Y;"
    if (/;\s*./i.test(cleanSQL)) {
        return {
            isValid: false,
            cleanSQL: '',
            error: 'Múltiples sentencias no permitidas.'
        };
    }

    // 5. Verificar nombres de tablas comunes incorrectos (solo en FROM y JOIN)
    const commonWrongTables = [
        { wrong: 'lineas_pedido', correct: 'lin_pedidos' },
        { wrong: 'linea_pedido', correct: 'lin_pedidos' }
    ];
    
    // Extraer solo la parte de tablas (FROM y JOINs) para validar
    // Buscar FROM tabla o JOIN tabla
    const fromJoinRegex = /\b(FROM|JOIN)\s+(\w+)/gi;
    let match;
    while ((match = fromJoinRegex.exec(cleanSQL)) !== null) {
        const tableName = match[2].toLowerCase();
        for (const { wrong, correct } of commonWrongTables) {
            if (tableName === wrong.toLowerCase()) {
                return { 
                    isValid: false, 
                    cleanSQL: '', 
                    error: `Nombre de tabla incorrecto: '${wrong}'. La tabla correcta es '${correct}'. Por favor, verifica el esquema de la base de datos.` 
                };
            }
        }
    }
    
    // 5b. Verificar sintaxis SQLite (incorrecta para MySQL)
    if (cleanSQL.includes("DATE('now')")) {
        return { 
            isValid: false, 
            cleanSQL: '', 
            error: `Sintaxis incorrecta: DATE('now') es de SQLite. Usa CURDATE() para MySQL.` 
        };
    }

    // 6. Garantizar límite de filas (LIMIT) si es un SELECT (opcional pero recomendado)
    if (upperSQL.startsWith('SELECT') && !upperSQL.includes('LIMIT')) {
        // Un poco arriesgado parsear SQL complejo, pero para casos simples agrega protección
        cleanSQL += ' LIMIT 1000';
    }

    // Regresar el SQL validado y limpio
    // Si la cadena termina en un ; provisto desde un LIMIT inyectado o por la limpieza
    cleanSQL = cleanSQL.replace(/;?\s*LIMIT 1000/i, ' LIMIT 1000');
    if (!cleanSQL.endsWith(';')) cleanSQL += ';';

    return { isValid: true, cleanSQL, error: null };
};

module.exports = {
    validate
};
