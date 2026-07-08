import type { APIRoute } from 'astro';
import pool from '@conexiones/lib/db.js';

export const POST: APIRoute = async ({ request, cookies }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const body = await request.json();
        const { productId, locationId, quantity, isTapa, isNewProduct, newProductData, observations, typeMove } = body;

        const resolvedLocationId = parseInt(locationId);
        const resolvedQuantity = parseFloat(quantity);
        const resolvedTypeMove = typeMove === 'EGRESO' ? 'EGRESO' : 'INGRESO';

        if (isNaN(resolvedLocationId) || isNaN(resolvedQuantity) || resolvedQuantity <= 0) {
            await client.query('ROLLBACK');
            return new Response(JSON.stringify({ success: false, error: 'Invalid location or quantity' }), { status: 400 });
        }

        // Si es salida (egreso), la cantidad a guardar en deposito_movimientos y Productos es negativa
        const moveQuantity = resolvedTypeMove === 'EGRESO' ? -resolvedQuantity : resolvedQuantity;

        // Obtener el operador de la sesión
        const stockSession = cookies.get('stock_session')?.value || 'unknown_operator';
        const operatorEmail = stockSession === 'authenticated_stock' ? 'stock@alvarezplacas.com.ar' : stockSession;

        let resolvedProductId = productId;

        // Si es un producto nuevo, lo damos de alta en estado de "Revision"
        if (isNewProduct && newProductData) {
            const brandId = parseInt(newProductData.brandId) || 24; // Generico por defecto
            let brandCode = '99';
            
            // Buscar el código de la marca en la DB
            const brandRes = await client.query('SELECT codigo FROM marcas WHERE id = $1', [brandId]);
            if (brandRes.rows.length > 0) {
                brandCode = brandRes.rows[0].codigo || '99';
            }

            // Generar un SKU temporal de revisión
            const tempSku = `M-${brandCode}-REV-${Math.floor(1000 + Math.random() * 9000)}`;
            const thicknessNum = parseFloat(newProductData.thickness) || 18.0;

            const name = `${newProductData.brandName} ${newProductData.colorName} ${thicknessNum}mm`.toUpperCase();

            // Insertar el producto en estado 'Revision' con el soporte indicado
            const insertRes = await client.query(
                `INSERT INTO "Productos" (nombre, sku, marca, rubro, espesor, "Estado", color_real, linea, stock_actual, soporte) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                [
                    name,
                    tempSku,
                    brandId,
                    8, // Rubro Placas (id 8 en la base de datos)
                    thicknessNum,
                    'Revision',
                    newProductData.colorName || '',
                    newProductData.lineName || '',
                    moveQuantity,
                    newProductData.soporte || null
                ]
            );
            resolvedProductId = insertRes.rows[0].id;
        }

        if (!resolvedProductId) {
            await client.query('ROLLBACK');
            return new Response(JSON.stringify({ success: false, error: 'No product ID resolved' }), { status: 400 });
        }

        // 1. Insertar movimiento en depósito
        await client.query(
            `INSERT INTO deposito_movimientos (product_id, location_id, quantity, type_move, is_tapa, observations, operator_email) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [resolvedProductId, resolvedLocationId, moveQuantity, resolvedTypeMove, isTapa || false, observations || '', operatorEmail]
        );

        // 2. Actualizar stock del producto (si no es nuevo, ya que si es nuevo se insertó con el stock_actual inicial)
        if (!isNewProduct) {
            await client.query(
                `UPDATE "Productos" SET stock_actual = COALESCE(stock_actual, 0) + $1 WHERE id = $2`,
                [moveQuantity, resolvedProductId]
            );
        }

        await client.query('COMMIT');

        return new Response(JSON.stringify({ success: true, productId: resolvedProductId }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving stock:', error);
        return new Response(JSON.stringify({ success: false, error: 'Database error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } finally {
        client.release();
    }
};
