/**
 * Extrae el primer SQL válido de una respuesta de IA que puede contener
 * múltiples consultas, texto explicativo, markdown, etc.
 */
const extractFirstSQL = (rawResponse) => {
    if (!rawResponse || typeof rawResponse !== 'string') {
        return rawResponse;
    }

    // 1. Intentar extraer del primer bloque markdown ```sql ... ```
    const markdownMatch = rawResponse.match(/```sql\s*([\s\S]*?)```/i);
    if (markdownMatch) {
        return markdownMatch[1].trim();
    }

    // 2. Intentar extraer de cualquier bloque markdown ``` ... ```
    const genericMarkdownMatch = rawResponse.match(/```\s*([\s\S]*?)```/i);
    if (genericMarkdownMatch) {
        return genericMarkdownMatch[1].trim();
    }

    // 3. Buscar primer SELECT hasta el primer ;
    const selectMatch = rawResponse.match(/(SELECT[\s\S]*?);/i);
    if (selectMatch) {
        return selectMatch[1].trim() + ';';
    }

    // 4. Fallback: retornar original
    return rawResponse;
};

const validate = (sql) => {
    if (!sql || typeof sql !== 'string') {
        return { isValid: false, cleanSQL: '', error: 'SQL vacío o inválido.' };
    }

    // 1. Limpieza general
    let cleanSQL = sql.trim();
    
    // Quitar todo después de separadores comunes (---, ___, Notas)
    cleanSQL = cleanSQL.split(/\n?\s*---+\s*\n?/)[0]; // Separador ---
    cleanSQL = cleanSQL.split(/\n?\s*___+\s*\n?/)[0]; // Separador ___
    cleanSQL = cleanSQL.split(/\*\*Nota:\*\*/i)[0];  // Notas
    cleanSQL = cleanSQL.split(/Nota:/i)[0];  // Notas sin negrita
    
    // Quitar markdown backticks si la IA los incluye
    cleanSQL = cleanSQL.replace(/^```sql/i, '');
    cleanSQL = cleanSQL.replace(/^```/i, '');
    cleanSQL = cleanSQL.replace(/```$/i, '');
    
    // Quitar comentarios SQL (-- y /* */)
    cleanSQL = cleanSQL.replace(/\/\*[\s\S]*?\*\//g, ''); // /* multi-line */
    cleanSQL = cleanSQL.replace(/--.*$/gm, ''); // -- single line
    
    cleanSQL = cleanSQL.trim();
    
    // Log para debugging
    console.log('🔍 SQL Validator - Input:', sql.substring(0, 150) + '...');
    console.log('🔍 SQL Validator - Cleaned:', cleanSQL.substring(0, 150) + '...');

    const upperSQL = cleanSQL.toUpperCase();

    // 2. Whitelist estricta de statements
    const allowedStarts = ['SELECT', 'SHOW', 'DESCRIBE', 'WITH'];
    const startsWithAllowed = allowedStarts.some(cmd => upperSQL.startsWith(cmd));
    
    if (!startsWithAllowed) {
        console.log('❌ SQL Validator - No empieza con comando permitido');
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
            console.log(`❌ SQL Validator - Palabra prohibida detectada: ${word}`);
            return { 
                isValid: false, 
                cleanSQL: '', 
                error: `Operación bloqueada por seguridad. Se detectó comando prohibido: ${word}.` 
            };
        }
    }

    // 4. Anti-inyección de base (múltiples statements)
    // Detectar ; seguido de otro statement (no solo espacios o comentarios al final)
    // Remover espacios y punto y coma al final para la verificación
    const sqlForCheck = cleanSQL.replace(/;\s*$/, '').trim();
    const remainingAfterSemicolon = sqlForCheck.split(';').slice(1).join(';').trim();
    if (remainingAfterSemicolon.length > 0) {
        console.log('❌ SQL Validator - Múltiples sentencias detectadas');
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
    
    console.log('✅ SQL Validator - SQL válido');

    return { isValid: true, cleanSQL, error: null };
};

module.exports = {
    validate,
    extractFirstSQL
};
