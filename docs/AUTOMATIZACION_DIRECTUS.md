# 🤖 Automatización de Catálogo en Directus (v16)

Este documento detalla la lógica de automatización para la generación de **SKU** y **Descripciones** de productos en Alvarez Placas, basada en el [Manual de Catalogación](https://alvarezplacas.com.ar/manuales/Manual_Catalogacion_Alvarez_Placas.html).

## 🧩 Estructura de Datos en Directus

Para que la automatización funcione, la colección `productos` debe tener los siguientes campos relacionales:

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `rubro` | M2O | Relación con la tabla `rubros` | Maderas (M) |
| `marca` | M2O | Relación con la tabla `marcas` | EGGER (10) |
| `modelo` | String | Nombre del diseño o color | Roble Vicenza |
| `espesor` | Decimal | Grosor en milímetros | 18.0 |
| `soporte` | String | Material base | MDF / Aglomerado |
| `sku` | String | Identificador único (Auto-generado) | M-10-0042 |
| `descripcion` | String | Nombre comercial (Auto-generado) | Placa EGGER Roble Vicenza 18mm MDF |

---

## 🆔 Lógica del SKU (X-YY-ZZZZ)

El SKU se genera automáticamente al crear un producto mediante un **Directus Flow** (Trigger: Item Create/Update).

### Componentes:
1. **X (Rubro)**: Prefijo de 1 letra extraído de `rubro.codigo_letra`.
   - `M`: Maderas
   - `H`: Herrajes
   - `I`: Insumos
2. **YY (Marca)**: Código de 2 dígitos extraído de `marca.codigo_numerico`.
   - `10`: EGGER
   - `20`: FAPLAC
3. **ZZZZ (Correlativo)**: Número incremental de 4 dígitos, completado con ceros a la izquierda.

**Fórmula Liquid/JS en Directus:**
`{{rubro_letra}}-{{marca_codigo}}-{{correlativo.padStart(4, '0')}}`

---

## 📝 Lógica de Descripción Automática

La descripción sigue una fórmula semántica para mejorar el SEO y la legibilidad del cliente.

### Fórmula General:
`[Categoría] + [Marca] + [Modelo/Color] + [Espesor/Medida] + [Soporte]`

### Especificaciones por Rubro:

#### 1. Maderas (M)
- **Fórmula**: `Placa [Marca] [Modelo] [Espesor]mm [Soporte]`
- **Ejemplo**: `Placa EGGER Roble Vicenza 18mm MDF`

#### 2. Herrajes (H)
- **Fórmula**: `[Tipo] [Marca] [Modelo] [Medida] [Acabado]`
- **Ejemplo**: `Corredera HAFELE Telescópica 450mm Zincada`

#### 3. Insumos (I)
- **Fórmula**: `[Producto] [Marca] [Capacidad/Peso] [Uso]`
- **Ejemplo**: `Adhesivo FORTEX 1kg Carpintero`

---

## ⚡ Implementación Técnica: Directus Flow

### Operación: "Calculador de Identidad" (Run Script)
Este script debe ir en una operación de tipo **Run Script** dentro del flujo disparado por `items.create`.

```javascript
module.exports = async function(data, { services, exceptions }) {
    const { ItemsService } = services;
    const { ServiceUnavailableException } = exceptions;
    
    // 1. Obtener servicios para Rubros y Marcas para traer los códigos
    const rubrosService = new ItemsService('rubros', { schema: data.schema });
    const marcasService = new ItemsService('marcas', { schema: data.schema });
    const productosService = new ItemsService('productos', { schema: data.schema });

    const rubro = await rubrosService.readOne(data.payload.rubro_id);
    const marca = await marcasService.readOne(data.payload.marca_id);

    if (!rubro || !marca) return data.payload;

    // 2. Calcular siguiente correlativo
    const existing = await productosService.readByQuery({
        filter: {
            rubro_id: { _eq: rubro.id },
            marca_id: { _eq: marca.id }
        },
        aggregate: { count: '*' }
    });
    
    const count = parseInt(existing[0].count) + 1;
    const correlativo = count.toString().padStart(4, '0');

    // 3. Generar SKU
    const sku = `${rubro.codigo_letra}-${marca.codigo_numerico}-${correlativo}`;

    // 4. Generar Descripción Dinámica
    let descripcion = "";
    const modelo = data.payload.modelo || "Sin Modelo";
    const espesor = data.payload.espesor ? `${data.payload.espesor}mm` : "";
    const soporte = data.payload.soporte || "";

    switch(rubro.codigo_letra) {
        case 'M':
            descripcion = `Placa ${marca.nombre} ${modelo} ${espesor} ${soporte}`.trim();
            break;
        case 'H':
            descripcion = `Herraje ${marca.nombre} ${modelo} ${soporte}`.trim();
            break;
        default:
            descripcion = `${rubro.nombre} ${marca.nombre} ${modelo}`.trim();
    }

    return {
        ...data.payload,
        sku: sku,
        descripcion: descripcion
    };
};
```

---

## 📥 Estrategia de Importación (CSV/Excel)
Para la carga masiva inicial:
1.  **Limpieza**: Asegurar que las columnas coincidan con `modelo`, `espesor`, `soporte`, `rubro_id`, `marca_id`.
2.  **Importador**: Usar el script `scripts/import_catalog.py`.
3.  **Desactivación Temporal**: Si hay más de 1000 productos, desactivar el Flow temporalmente, cargar los SKUs pre-calculados y luego reactivar.
