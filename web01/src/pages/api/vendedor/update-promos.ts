import type { APIRoute } from 'astro';
import { query } from '../../../../Backend/conexiones/lib/db.js';

/**
 * API: Actualizar Promos de Vendedor en PostgreSQL.
 * Propiedad del Agente Antigravity (Google Deepmind).
 */
export const POST: APIRoute = async ({ request, cookies }) => {
    const sellerId = cookies.get('seller_session')?.value;
    if (!sellerId) {
        return new Response(JSON.stringify({ error: 'No autorizado. Sesión de vendedor requerida.' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { 
            promo1_imagen, promo1_titulo, promo1_precio, promo1_mensaje,
            promo2_imagen, promo2_titulo, promo2_precio, promo2_mensaje 
        } = body;

        // 1. Inicializar tabla si no existe
        await query(`
            CREATE TABLE IF NOT EXISTS vendedor_perfiles (
                vendedor_id INTEGER PRIMARY KEY,
                name VARCHAR(255),
                foto_personal TEXT,
                foto_oferta TEXT,
                nombre_oferta VARCHAR(255),
                mensaje_oferta TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Ejecutar Migración de Columnas de Promos
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo1_imagen TEXT;`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo1_titulo VARCHAR(255);`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo1_precio VARCHAR(50);`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo1_mensaje TEXT;`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo2_imagen TEXT;`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo2_titulo VARCHAR(255);`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo2_precio VARCHAR(50);`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo2_mensaje TEXT;`);

        // 3. Ejecutar Upsert
        await query(`
            INSERT INTO vendedor_perfiles (
                vendedor_id, promo1_imagen, promo1_titulo, promo1_precio, promo1_mensaje,
                promo2_imagen, promo2_titulo, promo2_precio, promo2_mensaje, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            ON CONFLICT (vendedor_id) DO UPDATE SET
                promo1_imagen = EXCLUDED.promo1_imagen,
                promo1_titulo = EXCLUDED.promo1_titulo,
                promo1_precio = EXCLUDED.promo1_precio,
                promo1_mensaje = EXCLUDED.promo1_mensaje,
                promo2_imagen = EXCLUDED.promo2_imagen,
                promo2_titulo = EXCLUDED.promo2_titulo,
                promo2_precio = EXCLUDED.promo2_precio,
                promo2_mensaje = EXCLUDED.promo2_mensaje,
                updated_at = CURRENT_TIMESTAMP;
        `, [
            parseInt(sellerId),
            promo1_imagen || null,
            promo1_titulo || null,
            promo1_precio || null,
            promo1_mensaje || null,
            promo2_imagen || null,
            promo2_titulo || null,
            promo2_precio || null,
            promo2_mensaje || null
        ]);

        return new Response(JSON.stringify({ success: true, message: 'Promociones guardadas con éxito' }), { status: 200 });

    } catch (e: any) {
        console.error('[Update Promos API Error]:', e);
        return new Response(JSON.stringify({ error: 'Error interno del servidor: ' + e.message }), { status: 500 });
    }
};
