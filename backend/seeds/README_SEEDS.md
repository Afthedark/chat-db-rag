# Guia de Uso: Seeds de Reglas Iniciales

## Que es `initialRules.js`?

Este script carga las **reglas de contexto** que la IA utiliza para generar consultas SQL correctas. Las reglas se guardan en la tabla `ContextRules` de la base de datos de memoria (`ai_memory_db`).

Hay 2 tipos de reglas:

| Categoria | Key | Descripcion |
|-----------|-----|-------------|
| `INSTRUCCIONES` | `instrucciones_sistema` | Describe las tablas, columnas, JOINs y reglas criticas que la IA debe seguir |
| `EJEMPLOS_SQL` | `ejemplos_ventas_basicas` | Ejemplos de preguntas en lenguaje natural con su SQL correcto (few-shot learning) |

---

## Como ejecutar el seed

Desde la carpeta `backend`:

```bash
node seeds/initialRules.js
```

Salida esperada:

```
Conexion a BD Memoria verificada.
Tablas sincronizadas.
Seed Completado! Reglas creadas: 2, actualizadas: 0
```

- Si las reglas **no existen**, se crean nuevas (`creadas: 2`)
- Si las reglas **ya existen** (misma `key`), se **actualizan** automaticamente con el nuevo contenido (`actualizadas: 2`)

---

## Cuando ejecutar el seed

- **Primera vez** que configuras el sistema
- **Despues de modificar** el contenido de las reglas en el archivo `initialRules.js`
- **Despues de borrar** la tabla `ContextRules` (por ejemplo, para limpiar indices duplicados)

**No necesitas** ejecutarlo en cada reinicio del servidor. Las reglas persisten en la BD.

---

## Como personalizar las reglas

### Modificar las instrucciones del sistema

Edita el objeto con `key: 'instrucciones_sistema'` en el array `rulesSeed`:

```js
{
    key: 'instrucciones_sistema',
    category: 'INSTRUCCIONES',
    content: `TU CONTENIDO AQUI...`,
    isActive: true,
    keywords: 'palabras,clave,separadas,por,comas',
    priority: 10  // Mayor numero = mayor prioridad
}
```

**Campos importantes:**
- `content`: El texto que la IA recibira como instrucciones. Incluye nombres de tablas, columnas, JOINs y reglas.
- `keywords`: Palabras clave separadas por comas. El sistema usa estas para hacer "smart matching" - solo inyecta reglas relevantes a la pregunta del usuario.
- `priority`: Numero entero. Cuando hay muchas reglas, las de mayor prioridad se incluyen primero.

### Modificar los ejemplos SQL

Edita el objeto con `key: 'ejemplos_ventas_basicas'`:

```js
{
    key: 'ejemplos_ventas_basicas',
    category: 'EJEMPLOS_SQL',
    content: `Pregunta: Tu pregunta aqui
SQL: SELECT ... tu consulta aqui;

---

Pregunta: Otra pregunta
SQL: SELECT ... otra consulta;`,
    isActive: true,
    keywords: 'ventas,productos,clientes',
    priority: 9
}
```

**Formato de los ejemplos:**
```
Pregunta: [pregunta en lenguaje natural]
SQL: [consulta SQL correcta];

---

Pregunta: [siguiente pregunta]
SQL: [siguiente consulta];
```

- Usa `---` como separador entre ejemplos
- El SQL debe ser **valido y probado** contra tu BD real
- Incluye los patrones mas comunes que tus usuarios preguntaran

### Agregar nuevas reglas

Agrega un nuevo objeto al array `rulesSeed`:

```js
{
    key: 'mi_nueva_regla',          // Identificador unico
    category: 'EJEMPLOS_SQL',       // INSTRUCCIONES o EJEMPLOS_SQL
    content: `...`,                 // Contenido de la regla
    isActive: true,
    keywords: 'palabras,clave',
    priority: 8
}
```

Luego ejecuta `node seeds/initialRules.js` para cargarla.

---

## Tambien puedes crear reglas desde la interfaz web

Ademas de este archivo seed, puedes crear y editar reglas desde:

```
http://localhost:3000/admin/rules
```

Las reglas creadas desde la interfaz web se guardan en la misma tabla `ContextRules` y funcionan de la misma manera. La ventaja del seed es que puedes versionar las reglas base con Git.

---

## Limites de presupuesto

El sistema tiene limites automaticos para no saturar la ventana de contexto de la IA:

| Categoria | Max reglas | Max caracteres |
|-----------|-----------|----------------|
| `INSTRUCCIONES` | 5 | 1,500 chars |
| `EJEMPLOS_SQL` | 3 | 2,000 chars |

Si hay mas reglas de las que caben, el sistema selecciona las de mayor `priority` primero.

---

## Troubleshooting

### Las reglas no se actualizan
El script usa la `key` como identificador. Si cambias la `key`, se creara una regla nueva en vez de actualizar la existente. Mantene las keys constantes.

### Error "Too many keys"
Si ves el error `ER_TOO_MANY_KEYS` al iniciar el server, la tabla acumulo demasiados indices. Solucion:

```sql
-- Ejecutar en la BD ai_memory_db
DROP TABLE IF EXISTS ContextRules;
```

Luego reinicia el server (`npm run dev`) y ejecuta el seed de nuevo.

### Quiero ver que reglas tiene la BD actualmente

```sql
SELECT id, `key`, category, priority, isActive, LENGTH(content) as chars
FROM ContextRules
ORDER BY category, priority DESC;
```
