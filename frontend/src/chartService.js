/**
 * ChartService - Servicio independiente para visualización de datos con Chart.js
 * 
 * Este servicio proporciona una API limpia y desacoplada para generar gráficos
 * desde cualquier parte de la aplicación.
 */

const ChartService = {
    // Estado interno
    currentChart: null,
    currentData: null,
    canvasId: null,
    currentChartType: 'bar',

    // Paleta de colores para gráficos
    colorPalette: [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Yellow
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(6, 182, 212, 0.8)',    // Cyan
        'rgba(249, 115, 22, 0.8)',   // Orange
        'rgba(99, 102, 241, 0.8)',   // Indigo
        'rgba(20, 184, 166, 0.8)',   // Teal
    ],

    borderColorPalette: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
        'rgb(139, 92, 246)',
        'rgb(236, 72, 153)',
        'rgb(6, 182, 212)',
        'rgb(249, 115, 22)',
        'rgb(99, 102, 241)',
        'rgb(20, 184, 166)',
    ],

    /**
     * Inicializa el servicio con el ID del canvas
     * @param {string} canvasId - ID del elemento canvas
     */
    init(canvasId) {
        this.canvasId = canvasId;
        this.destroy();
        return this;
    },

    /**
     * Establece los datos a visualizar
     * @param {Array<Record<string, any>>} data - Array de objetos con los datos
     */
    setData(data) {
        if (!Array.isArray(data)) {
            console.error('ChartService: Los datos deben ser un array');
            return this;
        }
        this.currentData = data;
        return this;
    },

    /**
     * Detecta automáticamente el mejor tipo de gráfico para los datos
     * @param {Array<Record<string, any>>} data - Datos a analizar
     * @returns {string} Tipo de gráfico recomendado
     */
    detectChartType(data) {
        if (!data || data.length === 0) return 'bar';

        const columns = Object.keys(data[0]);
        const numericColumns = columns.filter(col => this._isNumericColumn(data, col));
        const categoricalColumns = columns.filter(col => !this._isNumericColumn(data, col));

        // Si hay 1 columna categórica y 1 numérica -> Pie o Bar
        if (categoricalColumns.length === 1 && numericColumns.length === 1) {
            return data.length <= 6 ? 'pie' : 'bar';
        }

        // Si hay 2 columnas numéricas -> Line
        if (numericColumns.length >= 2 && categoricalColumns.length === 0) {
            return 'line';
        }

        // Si hay múltiples columnas numéricas -> Bar (múltiples series)
        if (numericColumns.length > 1) {
            return 'bar';
        }

        // Por defecto -> Bar
        return 'bar';
    },

    /**
     * Genera el gráfico con el tipo especificado
     * @param {string} type - Tipo de gráfico ('bar', 'line', 'pie', 'doughnut', 'radar', 'auto')
     */
    generateChart(type = 'auto') {
        if (!this.canvasId || !this.currentData) {
            console.error('ChartService: No hay canvas o datos inicializados');
            return;
        }

        const canvas = document.getElementById(this.canvasId);
        if (!canvas) {
            console.error(`ChartService: Canvas con ID "${this.canvasId}" no encontrado`);
            return;
        }

        // Destruir gráfico anterior si existe
        this.destroy();

        // Detectar tipo automáticamente si es necesario
        const chartType = type === 'auto' ? this.detectChartType(this.currentData) : type;
        this.currentChartType = chartType;

        // Preparar datos según el tipo de gráfico
        const chartData = this._prepareChartData(chartType);

        // Configuración de opciones según el tipo
        const options = this._getChartOptions(chartType);

        // Crear el gráfico
        this.currentChart = new Chart(canvas, {
            type: chartType,
            data: chartData,
            options: options
        });

        return this.currentChart;
    },

    /**
     * Cambia el tipo de gráfico manteniendo los datos
     * @param {string} newType - Nuevo tipo de gráfico
     */
    changeChartType(newType) {
        this.generateChart(newType);
    },

    /**
     * Destruye la instancia actual del gráfico
     */
    destroy() {
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
    },

    /**
     * Descarga el gráfico como imagen PNG
     * @param {string} filename - Nombre del archivo (opcional)
     */
    downloadImage(filename = 'grafico.png') {
        if (!this.currentChart) {
            console.error('ChartService: No hay gráfico para descargar');
            return;
        }

        const link = document.createElement('a');
        link.download = filename;
        link.href = this.currentChart.toBase64Image();
        link.click();
    },

    /**
     * Obtiene el tipo de gráfico actual
     */
    getCurrentChartType() {
        return this.currentChartType;
    },

    // ============ MÉTODOS PRIVADOS ============

    /**
     * Verifica si una columna es numérica
     */
    _isNumericColumn(data, column) {
        return data.every(row => {
            const val = row[column];
            return val === null || val === undefined || typeof val === 'number' || !isNaN(parseFloat(val));
        });
    },

    /**
     * Prepara los datos en formato que Chart.js espera
     */
    _prepareChartData(chartType) {
        const data = this.currentData;
        const columns = Object.keys(data[0]);
        
        // Para gráficos circulares (pie, doughnut)
        if (chartType === 'pie' || chartType === 'doughnut') {
            return this._prepareCircularChartData(data, columns);
        }

        // Para gráficos de barras, líneas y radar
        return this._prepareCartesianChartData(data, columns, chartType);
    },

    /**
     * Prepara datos para gráficos circulares
     */
    _prepareCircularChartData(data, columns) {
        // Encontrar columna categórica (labels) y numérica (valores)
        const categoricalCol = columns.find(col => !this._isNumericColumn(data, col)) || columns[0];
        const numericCol = columns.find(col => this._isNumericColumn(data, col) && col !== categoricalCol) || columns[1];

        const labels = data.map(row => row[categoricalCol]);
        const values = data.map(row => parseFloat(row[numericCol]) || 0);

        return {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: this._getColors(values.length),
                borderColor: this.borderColorPalette,
                borderWidth: 1
            }]
        };
    },

    /**
     * Prepara datos para gráficos cartesianos (bar, line, radar)
     */
    _prepareCartesianChartData(data, columns, chartType) {
        // Intentar encontrar una columna de etiquetas (categórica o fecha)
        let labelCol = columns.find(col => {
            const isCat = !this._isNumericColumn(data, col);
            const isDate = data.some(row => {
                const val = row[col];
                return val && !isNaN(Date.parse(val));
            });
            return isCat || isDate;
        });

        // Si no hay columna de etiquetas, usar el índice
        const labels = labelCol 
            ? data.map(row => row[labelCol])
            : data.map((_, i) => `Item ${i + 1}`);

        // Crear datasets para cada columna numérica (excepto la de etiquetas)
        const numericCols = columns.filter(col => 
            this._isNumericColumn(data, col) && col !== labelCol
        );

        // Si no hay columnas numéricas, usar todas las columnas excepto la de etiquetas
        const datasetCols = numericCols.length > 0 ? numericCols : columns.filter(col => col !== labelCol);

        const datasets = datasetCols.map((col, index) => ({
            label: col,
            data: data.map(row => parseFloat(row[col]) || 0),
            backgroundColor: chartType === 'line' 
                ? this.colorPalette[index % this.colorPalette.length]
                : this.colorPalette[index % this.colorPalette.length].replace('0.8', '0.6'),
            borderColor: this.borderColorPalette[index % this.borderColorPalette.length],
            borderWidth: 2,
            fill: chartType === 'radar',
            tension: chartType === 'line' ? 0.3 : 0
        }));

        return { labels, datasets };
    },

    /**
     * Obtiene colores para el gráfico
     */
    _getColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(this.colorPalette[i % this.colorPalette.length]);
        }
        return colors;
    },

    /**
     * Obtiene las opciones de configuración según el tipo de gráfico
     */
    _getChartOptions(chartType) {
        const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
        const textColor = isDark ? '#e5e7eb' : '#374151';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: { family: 'Inter, sans-serif', size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#fff' : '#000',
                    bodyColor: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8
                }
            }
        };

        // Opciones específicas para gráficos circulares
        if (chartType === 'pie' || chartType === 'doughnut') {
            return commonOptions;
        }

        // Opciones para gráficos cartesianos
        return {
            ...commonOptions,
            scales: {
                x: {
                    ticks: { color: textColor, font: { family: 'Inter, sans-serif' } },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor, font: { family: 'Inter, sans-serif' } },
                    grid: { color: gridColor },
                    beginAtZero: true
                }
            }
        };
    }
};

// Exportar para uso global
window.ChartService = ChartService;
