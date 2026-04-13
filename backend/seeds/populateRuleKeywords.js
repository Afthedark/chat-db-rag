/**
 * Script to auto-populate keywords for existing rules
 * Run: node seeds/populateRuleKeywords.js
 */

const { sequelize, ContextRule } = require('../models');
const embeddingService = require('../services/embeddingService');

const autoGenerateKeywords = (content) => {
    if (!content) return '';
    const keywords = embeddingService.extractKeywords(content);
    return [...new Set(keywords)].slice(0, 15).join(',');
};

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection verified');

        const { Op } = require('sequelize');
        const rules = await ContextRule.findAll({
            where: {
                [Op.or]: [
                    { keywords: null },
                    { keywords: '' }
                ]
            }
        });

        if (rules.length === 0) {
            console.log('✅ All rules already have keywords. Nothing to do.');
            process.exit(0);
            return;
        }

        console.log(`\n📝 Found ${rules.length} rules without keywords\n`);

        let updated = 0;
        for (const rule of rules) {
            const autoKeywords = autoGenerateKeywords(rule.content);
            
            if (autoKeywords) {
                await rule.update({ keywords: autoKeywords });
                updated++;
                console.log(`✓ Rule: "${rule.key}"`);
                console.log(`  Keywords: ${autoKeywords}\n`);
            } else {
                console.log(`✗ Rule: "${rule.key}" - No keywords could be extracted\n`);
            }
        }

        console.log(`\n✅ Done! Updated ${updated}/${rules.length} rules`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

run();
