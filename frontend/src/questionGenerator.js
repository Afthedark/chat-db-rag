import { baseQuestions, questionPatterns } from './suggestedQuestions.js';

export class QuestionGenerator {
    constructor() {
        this.generatedQuestions = new Set();
    }

    generateVariations(baseQuestion, count = 3) {
        const variations = [];
        
        // Pattern 1: Date substitution
        questionPatterns.dateTemplates.forEach(template => {
            if (baseQuestion.includes(template.from)) {
                template.variations.forEach(variation => {
                    const newQ = baseQuestion.replace(template.from, variation);
                    if (!this.isDuplicate(newQ)) {
                        variations.push({
                            text: newQ,
                            isDynamic: true,
                            sourcePattern: 'date-variation'
                        });
                    }
                });
            }
        });
        
        // Pattern 2: Product substitution
        if (baseQuestion.includes('productos') || baseQuestion.includes('pollo')) {
            questionPatterns.productKeywords.forEach(product => {
                const newQ = baseQuestion.replace(/pollo|productos/, product);
                if (!this.isDuplicate(newQ)) {
                    variations.push({
                        text: newQ,
                        isDynamic: true,
                        sourcePattern: 'product-variation'
                    });
                }
            });
        }
        
        return variations.slice(0, count);
    }

    generateAllQuestions() {
        const allQuestions = [];
        
        baseQuestions.forEach(category => {
            const categoryQuestions = {
                category: category.category,
                icon: category.icon,
                questions: [
                    // Static questions
                    ...category.questions.map(q => ({ text: q, isDynamic: false })),
                    // Dynamic variations
                    ...this.generateVariations(category.questions[0], 3)
                ]
            };
            allQuestions.push(categoryQuestions);
        });
        
        return allQuestions;
    }

    isDuplicate(question) {
        return this.generatedQuestions.has(question);
    }

    refresh() {
        this.generatedQuestions.clear();
        return this.generateAllQuestions();
    }
}
