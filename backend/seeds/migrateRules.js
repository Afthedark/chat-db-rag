/**
 * Script de Migración de Reglas de Contexto
 * 
 * Migra las categorías antiguas a las nuevas:
 * - PROMPT_SISTEMA + PROMPT_NEGOCIO + ESTRUCTURA_DB → INSTRUCCIONES
 * - EJEMPLO_SQL → EJEMPLOS_SQL
 * 
 * Uso: node seeds/migrateRules.js
 */

const { sequelize, ContextRule } = require('../models');

const migrateRules = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a BD Memoria verificada.');

        // Obtener todas las reglas existentes
        const allRules = await ContextRule.findAll();
        console.log(`\n📋 Total de reglas encontradas: ${allRules.length}`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const rule of allRules) {
            const oldCategory = rule.category;
            let newCategory = null;

            // Mapeo de categorías antiguas a nuevas
            if (['PROMPT_SISTEMA', 'PROMPT_NEGOCIO', 'ESTRUCTURA_DB'].includes(oldCategory)) {
                newCategory = 'INSTRUCCIONES';
            } else if (oldCategory === 'EJEMPLO_SQL') {
                newCategory = 'EJEMPLOS_SQL';
            } else if (['INSTRUCCIONES', 'EJEMPLOS_SQL'].includes(oldCategory)) {
                console.log(`  ✓ Regla "${rule.key}" ya está actualizada (${oldCategory})`);
                skippedCount++;
                continue;
            } else {
                console.log(`  ⚠ Regla "${rule.key}" tiene categoría desconocida: ${oldCategory}`);
                skippedCount++;
                continue;
            }

            // Actualizar la regla
            await rule.update({ category: newCategory });
            console.log(`  🔄 "${rule.key}": ${oldCategory} → ${newCategory}`);
            migratedCount++;
        }

        console.log('\n✅ Migración completada:');
        console.log(`   - Reglas migradas: ${migratedCount}`);
        console.log(`   - Reglas omitidas: ${skippedCount}`);
        console.log(`   - Total procesadas: ${allRules.length}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        process.exit(1);
    }
};

migrateRules();
