import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

// Campos base que siempre devolvemos para productos
const PRODUCT_FIELDS = [
    'id', 'nombre', 'sku', 'modelo', 'linea',
    'espesor', 'soporte', 'marca.nombre', 'foto_principal'
] as const;

// Helper: normaliza la respuesta del SDK de Directus (siempre devuelve array)
function toArray<T>(response: T[] | { data: T[] }): T[] {
    return Array.isArray(response) ? response : (response as any).data ?? [];
}

// Helper: construye el filtro base para productos de Madera (Rubro M)
function baseFilter(brand: string, line?: string) {
    const conditions: any[] = [
        { rubro: { letra: { _eq: 'M' } } },
        { marca: { nombre: { _eq: brand } } },
        // Estado es un array en Directus — usamos _contains para "tiene Stock" 
        // o simplemente no filtramos por publicado para permitir items en proceso de carga
    ];

    if (line) {
        if (line === 'GENERAL') {
            // GENERAL = productos sin línea asignada
            conditions.push({
                _or: [
                    { linea: { _null: true } },
                    { linea: { _empty: true } }
                ]
            });
        } else {
            conditions.push({ linea: { _eq: line } });
        }
    }

    return { _and: conditions };
}

export const GET: APIRoute = async ({ url }) => {
    const brand  = url.searchParams.get('brand')  ?? '';
    const line   = url.searchParams.get('line')   ?? '';
    const search = url.searchParams.get('search') ?? '';
    const type   = url.searchParams.get('type')   ?? 'products'; // 'lines' | 'products'

    if (!brand) {
        return new Response(JSON.stringify([]), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // ── MODO LÍNEAS: devuelve la lista de colecciones/grupos de la marca ──────
        if (type === 'lines') {
            const raw = toArray(await directus.request(readItems('Productos', {
                fields: ['linea'],
                filter: {
                    _and: [
                        { rubro: { letra: { _eq: 'M' } } },
                        { marca: { nombre: { _eq: brand } } }
                    ]
                },
                limit: -1
            })));

            // Agrupamos fielmente por el campo 'linea' de Directus.
            // Si está vacío → GENERAL. Ordenamos alfabéticamente.
            const lines = [...new Set(
                raw.map((p: any) => (p.linea ?? '').toString().trim() || 'GENERAL')
            )].sort() as string[];

            return new Response(JSON.stringify(lines), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ── MODO PRODUCTOS: devuelve diseños/colores del grupo seleccionado ────────
        const filters = baseFilter(brand, line || undefined);

        // Búsqueda de texto opcional (barra de búsqueda)
        const combinedFilter = search
            ? {
                _and: [
                    filters,
                    {
                        _or: [
                            { nombre: { _icontains: search } },
                            { modelo: { _icontains: search } },
                            { sku:    { _icontains: search } }
                        ]
                    }
                ]
              }
            : filters;

        const raw = toArray(await directus.request(readItems('Productos', {
            fields: PRODUCT_FIELDS,
            filter: combinedFilter,
            limit: 500
        })));

        // nombre_corto: descripción corta del diseño para el desplegable.
        // Usamos 'modelo' si existe (ej: "GRIS SOMBRA"), sino el nombre completo.
        const products = raw.map((p: any) => ({
            ...p,
            nombre_corto: (p.modelo ?? '').trim() || p.nombre
        }));

        return new Response(JSON.stringify(products), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('[catalog.ts] Error:', err?.message ?? err);
        return new Response(JSON.stringify([]), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
