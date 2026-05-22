import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

/**
 * API: Actualizar Perfil de Vendedor en PostgreSQL.
 * Propiedad del Agente Antigravity (Google Deepmind).
 */
export const POST: APIRoute = async ({ request, cookies }) => {
    const sellerId = cookies.get('seller_session')?.value;
    if (!sellerId) {
        return new Response(JSON.stringify({ error: 'No autorizado. Sesión de vendedor requerida.' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, foto_personal, foto_oferta, nombre_oferta, mensaje_oferta } = body;

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

        // 2. Ejecutar Upsert
        await query(`
            INSERT INTO vendedor_perfiles (vendedor_id, name, foto_personal, foto_oferta, nombre_oferta, mensaje_oferta, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (vendedor_id) DO UPDATE SET
                name = EXCLUDED.name,
                foto_personal = EXCLUDED.foto_personal,
                foto_oferta = EXCLUDED.foto_oferta,
                nombre_oferta = EXCLUDED.nombre_oferta,
                mensaje_oferta = EXCLUDED.mensaje_oferta,
                updated_at = CURRENT_TIMESTAMP;
        `, [
            parseInt(sellerId),
            name || null,
            foto_personal || null,
            foto_oferta || null,
            nombre_oferta || null,
            mensaje_oferta || null
        ]);

        return new Response(JSON.stringify({ success: true, message: 'Perfil guardado con éxito' }), { status: 200 });

    } catch (e: any) {
        console.error('[Update Profile API Error]:', e);
        return new Response(JSON.stringify({ error: 'Error interno del servidor: ' + e.message }), { status: 500 });
    }
};
