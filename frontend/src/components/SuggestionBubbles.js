import { QuestionGenerator } from '../questionGenerator.js';

window.suggestionBubbles = function() {
    return {
        isOpen: false,
        selectedCategory: null,
        allCategories: [],
        hasDynamicQuestions: false,
        generator: new QuestionGenerator(),
        toastMessage: '',
        showToast: false,
        
        init() {
            this.loadQuestions();
        },
        
        loadQuestions() {
            this.allCategories = this.generator.generateAllQuestions();
            this.hasDynamicQuestions = this.allCategories.some(
                cat => cat.questions.some(q => q.isDynamic)
            );
        },
        
        toggle() {
            this.isOpen = !this.isOpen;
            if (this.isOpen && this.allCategories.length === 0) {
                this.loadQuestions();
            }
        },
        
        selectCategory(category) {
            this.selectedCategory = category;
        },
        
        async copyQuestion(question) {
            const questionText = typeof question === 'object' ? question.text : question;
            
            try {
                // Try modern clipboard API first
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(questionText);
                } else {
                    // Fallback for non-secure contexts (HTTP)
                    this.copyToClipboardFallback(questionText);
                }
                
                // Show toast feedback
                this.showToastMessage('Texto copiado. Pega con Ctrl+V');
                
                // Close bubble menu
                this.isOpen = false;
            } catch (err) {
                console.error('Error copying to clipboard:', err);
                // Try fallback even on error
                try {
                    this.copyToClipboardFallback(questionText);
                    this.showToastMessage('Texto copiado. Pega con Ctrl+V');
                    this.isOpen = false;
                } catch (fallbackErr) {
                    console.error('Fallback copy also failed:', fallbackErr);
                    this.showToastMessage('Error al copiar. Selecciona y copia manualmente.');
                }
            }
        },
        
        copyToClipboardFallback(text) {
            // Create temporary textarea element
            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            // Make it invisible but keep it in the DOM
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            textArea.setAttribute('readonly', '');
            
            document.body.appendChild(textArea);
            
            // Select and copy
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            
            // Cleanup
            document.body.removeChild(textArea);
            
            if (!successful) {
                throw new Error('execCommand copy failed');
            }
        },
        
        showToastMessage(message) {
            this.toastMessage = message;
            this.showToast = true;
            
            setTimeout(() => {
                this.showToast = false;
            }, 3000);
        },
        
        generateNewQuestions() {
            this.allCategories = this.generator.refresh();
            this.selectedCategory = null;
        }
    };
};
