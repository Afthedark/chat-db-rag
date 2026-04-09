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

    // 5. Garantizar límite de filas (LIMIT) si es un SELECT (optimizado para modelos locales)
    // Reducido a 100 para evitar sobrecarga de contexto en Paso 2
    if (upperSQL.startsWith('SELECT') && !upperSQL.includes('LIMIT')) {
        cleanSQL += ' LIMIT 100';
    }

    // Regresar el SQL validado y limpio
    // Normalizar el LIMIT agregado
    cleanSQL = cleanSQL.replace(/;?\s*LIMIT 100\s*$/i, ' LIMIT 100');
    if (!cleanSQL.endsWith(';')) cleanSQL += ';';

    return { isValid: true, cleanSQL, error: null };
};

module.exports = {
    validate
};
