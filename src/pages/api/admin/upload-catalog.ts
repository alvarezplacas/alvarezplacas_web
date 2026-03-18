import type { APIRoute } from 'astro';
import * as xlsx from 'xlsx';
import { query } from '../../../lib/db.js';

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No se envió ningún archivo' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const rawData = xlsx.utils.sheet_to_json(sheet);
        let processedCount = 0;

        for (const row of rawData as any[]) {
            const codigo = row['Codigo'] || row['codigo'] || row['CÓDIGO'] || '';
            const nombre = row['Nombre'] || row['nombre'] || row['NOMBRE'];
            const marca = row['Marca'] || row['marca'] || row['MARCA'] || 'General';
            const linea = row['Linea'] || row['linea'] || row['LÍNEA'] || 'Estándar';
            const precio = parseFloat(row['Precio'] || row['precio'] || row['PRECIO'] || 0);
            const categoria = row['Categoria'] || row['categoria'] || row['CATEGORIA'] || 'Placas';
            const espesor = row['Espesor'] || row['espesor'] || '18mm';

            if(!nombre) continue;
            
            // Excluir Madergold (Proveedor, no marca de producto)
            if (marca.toLowerCase().includes('madergold')) continue;

            // 1. Manejo de Marca
            let marcaId = null;
            const resMarca = await query("SELECT id FROM marcas WHERE nombre ILIKE $1 LIMIT 1", [marca]);
            if (!resMarca.rows || resMarca.rows.length === 0) {
                const num = await query("INSERT INTO marcas (nombre) VALUES ($1) RETURNING id", [marca]);
                marcaId = (num.rows as any[])[0].id;
            } else {
                marcaId = (resMarca.rows as any[])[0].id;
            }

            // 2. Manejo de Linea
            let lineaId = null;
            const resLinea = await query("SELECT id FROM lineas WHERE nombre ILIKE $1 AND marca_id = $2 LIMIT 1", [linea, marcaId]);
            if (!resLinea.rows || resLinea.rows.length === 0) {
                const numL = await query("INSERT INTO lineas (nombre, marca_id) VALUES ($1, $2) RETURNING id", [linea, marcaId]);
                lineaId = (numL.rows as any[])[0].id;
            } else {
                lineaId = (resLinea.rows as any[])[0].id;
            }

            // 3. Buscar Imagen por nombre y jerarquía
            let imagenCover = null;
            try {
                // Primero buscamos por nombre exacto en directus_files
                const resImg = await query("SELECT id FROM directus_files WHERE filename_download ILIKE $1 OR title ILIKE $1 LIMIT 1", [`%${nombre}%`]);
                if (resImg.rows && resImg.rows.length > 0) {
                    imagenCover = (resImg.rows as any[])[0].id;
                } else {
                    // Intento de búsqueda por estructura de carpetas (Simplificado: busca por nombre en cualquier carpeta)
                    // En el futuro se puede filtrar por folder_id si se mapean las carpetas de Directus
                }
            } catch (e) {
                console.log("No se pudo buscar imagen para", nombre);
            }

            // 4. Manejo de Categoria
            let catId = null;
            const resCat = await query("SELECT id FROM categorias WHERE nombre ILIKE $1 LIMIT 1", [categoria]);
            if (resCat.rows && resCat.rows.length > 0) {
                catId = (resCat.rows as any[])[0].id;
            } else {
                const numC = await query("INSERT INTO categorias (nombre, slug) VALUES ($1, $2) RETURNING id", [categoria, (categoria as string).toLowerCase().replace(/ /g, '-')]);
                catId = (numC.rows as any[])[0].id;
            }

            // 5. Manejo de Producto y Tags (Buscador Dinámico)
            let productoId = null;
            const resProd = await query("SELECT id FROM productos WHERE nombre = $1 AND marca_id = $2 LIMIT 1", [nombre, marcaId]);
            
            // Extracción inteligente de tags para el buscador (colores, texturas)
            const keywordTags: string[] = [];
            const nameLower = (nombre as string).toLowerCase();
            
            const colorKeywords = ['blanco', 'negro', 'gris', 'rojo', 'azul', 'verde', 'amarillo', 'beige', 'marron', 'crema', 'wengue', 'cedro', 'roble', 'haya', 'nogal', 'aluminio', 'grafito'];
            const textureKeywords = ['mate', 'brillante', 'texturado', 'liso', 'veta', 'poro', 'silk', 'nature', 'feelwood'];
            
            colorKeywords.forEach(k => { if (nameLower.includes(k)) keywordTags.push(k); });
            textureKeywords.forEach(k => { if (nameLower.includes(k)) keywordTags.push(k); });
            
            const tagsList = Array.from(new Set([categoria as string, marca as string, ...keywordTags])).filter(Boolean);
            
            if (!resProd.rows || resProd.rows.length === 0) {
                const numP = await query(
                    "INSERT INTO productos (status, nombre, marca_id, linea_id, categoria_id, imagen_cover, tags) VALUES ('published', $1, $2, $3, $4, $5, $6) RETURNING id",
                    [nombre, marcaId, lineaId, catId, imagenCover, JSON.stringify(tagsList)]
                );
                productoId = (numP.rows as any[])[0].id;
            } else {
                productoId = (resProd.rows as any[])[0].id;
                await query(
                    "UPDATE productos SET linea_id = $1, categoria_id = $2, imagen_cover = COALESCE($3, imagen_cover), tags = $4 WHERE id = $5",
                    [lineaId, catId, imagenCover, JSON.stringify(tagsList), productoId]
                );
            }

            // 6. Manejo de Variantes SKU (Precios)
            if (productoId) {
                const resVar = await query("SELECT id FROM variantes_sku WHERE producto_id = $1 AND (codigo_proveedor = $2 OR especificacion = $3) LIMIT 1", [productoId, (codigo as any).toString(), espesor]);
                
                if (!resVar.rows || resVar.rows.length === 0) {
                    await query(
                        "INSERT INTO variantes_sku (producto_id, codigo_proveedor, especificacion, precio_efectivo, ultima_act) VALUES ($1, $2, $3, $4, NOW())",
                        [productoId, (codigo as any).toString(), espesor, precio]
                    );
                } else {
                    await query(
                        "UPDATE variantes_sku SET codigo_proveedor = $1, precio_efectivo = $2, ultima_act = NOW() WHERE id = $3",
                        [(codigo as any).toString(), precio, (resVar.rows as any[])[0].id]
                    );
                }
            }
            
            processedCount++;
        }

        return new Response(JSON.stringify({ 
            success: true, 
            processed: processedCount 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Error procesando Excel:', error);
        return new Response(JSON.stringify({ 
            error: error.message || 'Error interno del servidor al procesar el Excel' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
