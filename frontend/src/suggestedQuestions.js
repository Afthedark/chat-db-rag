export const baseQuestions = [
    {
        category: 'Ventas Totales',
        icon: 'bi-cash-coin',
        questions: [
            'Cual es el total de ingresos por ventas en marzo de 2026',
            'Cuanto dinero generaron las ventas en total el dia de hoy',
            'Cuantas ventas (pedidos) hubo hoy y cual es el total de dinero recaudado',
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
            'Productos mas vendidos de la ultima semana'
        ]
    },
    {
        category: 'Consultas por Horario',
        icon: 'bi-clock',
        questions: [
            'Que productos fueron los mas vendidos hoy entre las 10:00 am y las 2:00 pm',
            'Top 3 de productos mas vendidos durante el horario de cena del 10 de mayo de 2026',
            'Productos mas vendidos ayer durante el horario de almuerzo'
        ]
    },
    {
        category: 'Clientes',
        icon: 'bi-people',
        questions: [
            'Top 5 clientes con mas compras',
            'Buscar productos que contengan pollo'
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
