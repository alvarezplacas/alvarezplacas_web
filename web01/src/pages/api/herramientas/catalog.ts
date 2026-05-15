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

// Mapeo industrial de prefijos de SKU por Marca
// Criterio: M (Melamina) - YY (Código Marca)
const BRAND_PREFIXES: Record<string, string> = {
    'FAPLAC': 'M-20-',
    'EGGER':  'M-10-',
    'SADEPAN': 'M-30-',
    'NOVA':    'M-40-',
    'SADEPAN (2820x1830)': 'M-30-', // Fallback para nombres largos
    'EGGER (2600x1820)':  'M-10-',
    'NOVA (3660x1830)':    'M-40-',
    'FAPLAC (2820x1830)': 'M-20-'
};

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
        // Resolvemos el prefijo industrial del SKU
        // Limpiamos el nombre de la marca (ej: "EGGER (2600x1820)" -> "EGGER")
        const brandKey = brand.split(' (')[0].toUpperCase();
        const prefix = BRAND_PREFIXES[brandKey] || BRAND_PREFIXES[brand] || '';

        if (!prefix && brand !== 'CUSTOM') {
            console.warn(`[catalog.ts] Prefijo industrial no encontrado para marca: "${brand}"`);
            // Si no hay prefijo, devolvemos vacío para no mezclar datos
            return new Response(JSON.stringify([]), { status: 200 });
        }

        const baseFilter = {
            _and: [
                { sku: { _starts_with: prefix } }
            ]
        };

        // ── MODO LÍNEAS ──────────────────────────────────────────────────────────
        if (type === 'lines') {
            const raw = toArray<{ linea: string | null }>(
                await directus.request(readItems('Productos', {
                    fields: ['linea'],
                    filter: baseFilter,
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

        // ── FILTROS ADICIONALES ─────────────────────────────────────────────────
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
                        { sku: { _starts_with: prefix } },
                        ...lineFilter,
                        ...searchFilter
                    ]
                },
                limit: 500,
                sort: ['modelo', 'espesor']
            }))
        );

        // ── MODO COLORES (deduplicado) ───────────────────────────────────────────
        // Devuelve colores únicos con todos sus espesores/soportes disponibles.
        // Ideal para el dropdown: el operario elige el color, luego el espesor se actualiza.
        if (type === 'colors') {
            const colorMap = new Map<string, any>();

            for (const p of raw) {
                const colorKey = (p.modelo ?? '').trim() || p.nombre;
                if (!colorMap.has(colorKey)) {
                    colorMap.set(colorKey, {
                        nombre_corto: colorKey,
                        foto_principal: p.foto_principal,
                        marca: p.marca?.nombre ?? brand,
                        espesores: [],     // lista de { espesor, soporte, id, sku }
                    });
                }
                const entry = colorMap.get(colorKey)!;
                // Agregar este espesor/soporte si no está ya
                const espesor = parseFloat(p.espesor ?? 0);
                const soporte = (p.soporte ?? '').toUpperCase();
                const yaExiste = entry.espesores.some(
                    (e: any) => e.espesor === espesor && e.soporte === soporte
                );
                if (!yaExiste) {
                    entry.espesores.push({ espesor, soporte, id: p.id, sku: p.sku });
                    // Ordenar espesores de menor a mayor
                    entry.espesores.sort((a: any, b: any) => a.espesor - b.espesor);
                }
                // Preferir la foto que sí exista
                if (!entry.foto_principal && p.foto_principal) {
                    entry.foto_principal = p.foto_principal;
                }
            }

            return new Response(JSON.stringify([...colorMap.values()]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ── MODO PRODUCTOS (lista completa, para búsqueda libre) ────────────────
        // nombre_corto: preferimos 'modelo' (descripción corta del color),
        // si no existe usamos el nombre completo del producto.
        const products = raw.map(p => ({
            ...p,
            espesor: parseFloat(p.espesor ?? 0),
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
