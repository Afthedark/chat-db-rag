export const baseQuestions = [
    {
        category: 'Ventas Totales',
        icon: 'bi-cash-coin',
        questions: [
            'Cual es el total de ingresos por ventas en marzo de 2026',
            'Cuanto dinero generaron las ventas en total el dia de hoy',
            'Cuantas ventas hubo hoy',
            'Cuanto fue el total recaudado en ventas el 12 de abril de 2026',
            'Cuanto vendimos en total durante todo el año 2025'
        ]
    },
    {
        category: 'Productos Mas Vendidos',
        icon: 'bi-trophy',
        questions: [
            'Producto mas vendido',
            'Cuales son los productos mas vendidos de esta semana',
            'Los 5 productos mas vendidos hoy',
            'Productos mas vendidos de la ultima semana (solo cantidad, sin ingresos)',
            'Productos mas vendidos de la ultima semana con sus ingresos en Bolivianos'
        ]
    },
    {
        category: 'Consultas por Horario',
        icon: 'bi-clock',
        questions: [
            'Que productos fueron los mas vendidos hoy entre las 10:00 am y las 2:00 pm',
            'Cuantos productos se vendieron ayer entre las 9:00 am y las 10:00 am',
            'Top 3 de productos mas vendidos el 13 de abril de 10am a 17pm',
            'Productos mas vendidos ayer durante el horario de almuerzo'
        ]
    },
    {
        category: 'Busquedas',
        icon: 'bi-search',
        questions: [
            'Buscar productos que contengan pollo',
            'Cuantas Sanguchitas se vendieron hoy especificamente al mediodia'
        ]
    }
];

export const questionPatterns = {
    dateTemplates: [
        { from: 'hoy', variations: ['ayer', 'esta semana', 'semana pasada', 'mes pasado'] },
        { from: 'marzo de 2026', variations: ['abril de 2026', 'mayo de 2026', '2025'] }
    ],
    productKeywords: ['pollo', 'broaster', 'alitas', 'sanguchitas', 'coca cola', 'pepsi'],
    timeRanges: ['10:00 am y las 2:00 pm', '8:00 am y las 11:00 am', '6:00 pm y las 9:00 pm'],
    metrics: ['cantidad', 'ingresos', 'cantidad e ingresos']
};
