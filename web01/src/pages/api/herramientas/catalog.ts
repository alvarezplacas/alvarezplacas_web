import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

// Campos base que devolvemos para productos
const PRODUCT_FIELDS = [
    'id', 'nombre', 'sku', 'modelo', 'linea',
    'espesor', 'soporte', 'marca.nombre', 'foto_principal'
] as const;

// Helper: normaliza la respuesta del SDK (siempre devuelve array)
function toArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) return response as T[];
    if (response && typeof response === 'object' && 'data' in response) {
        return (response as any).data as T[];
    }
    return [];
}

// Resuelve el ID numérico de una marca por su nombre.
// CRÍTICO: Directus almacena 'marca' como FK numérica en Productos.
// Filtrar por nombre via JOIN es poco fiable — usamos el ID directo.
async function resolveBrandId(brandName: string): Promise<number | null> {
    const res = toArray<{ id: number }>(
        await directus.request(readItems('marcas', {
            fields: ['id'],
            filter: { nombre: { _eq: brandName } },
            limit: 1
        }))
    );
    return res[0]?.id ?? null;
}

export const GET: APIRoute = async ({ url }) => {
    const brand  = url.searchParams.get('brand')  ?? '';
    const line   = url.searchParams.get('line')   ?? '';
    const search = url.searchParams.get('search') ?? '';
    const type   = url.searchParams.get('type')   ?? 'products';

    if (!brand) {
        return new Response(JSON.stringify({ error: 'brand is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Resolvemos el ID de la marca UNA SOLA VEZ al inicio.
        // Esto garantiza que el filtro sea exacto sin depender de JOINs en Directus.
        const brandId = await resolveBrandId(brand);

        if (!brandId) {
            console.warn(`[catalog.ts] Marca no encontrada: "${brand}"`);
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ── MODO LÍNEAS ──────────────────────────────────────────────────────────
        // Devuelve los valores únicos del campo 'linea' para la marca seleccionada.
        // Si un producto tiene 'linea' vacía → aparece como "GENERAL".
        if (type === 'lines') {
            const raw = toArray<{ linea: string | null }>(
                await directus.request(readItems('Productos', {
                    fields: ['linea'],
                    filter: {
                        _and: [
                            { rubro: { letra: { _eq: 'M' } } },
                            { marca: { _eq: brandId } }
                        ]
                    },
                    limit: -1
                }))
            );

            const lines = [
                ...new Set(raw.map(p => (p.linea ?? '').toString().trim() || 'GENERAL'))
            ].sort();

            return new Response(JSON.stringify(lines), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ── MODO PRODUCTOS ───────────────────────────────────────────────────────
        // Devuelve los productos de la marca + línea seleccionada.
        // Si la línea es "GENERAL" → productos SIN línea asignada en Directus.
        const lineFilter = !line
            ? []
            : line === 'GENERAL'
                ? [{ _or: [{ linea: { _null: true } }, { linea: { _empty: true } }] }]
                : [{ linea: { _eq: line } }];

        const searchFilter = search
            ? [{
                _or: [
                    { nombre: { _icontains: search } },
                    { modelo:  { _icontains: search } },
                    { sku:     { _icontains: search } }
                ]
              }]
            : [];

        const raw = toArray<any>(
            await directus.request(readItems('Productos', {
                fields: PRODUCT_FIELDS,
                filter: {
                    _and: [
                        { rubro: { letra: { _eq: 'M' } } },
                        { marca: { _eq: brandId } },
                        ...lineFilter,
                        ...searchFilter
                    ]
                },
                limit: 500
            }))
        );

        // nombre_corto: preferimos 'modelo' (descripción corta del color),
        // si no existe usamos el nombre completo del producto.
        const products = raw.map(p => ({
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
