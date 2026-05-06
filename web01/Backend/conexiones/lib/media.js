
/**
 * Utilidad compartida para resolución de imágenes de productos.
 * Sincronizada con la lógica de CatalogGrid.astro.
 */

import fs from 'node:fs';
import path from 'node:path';

const LOGO_ID = "209a486b-8623-4c3e-8f8e-2a3288f1f0fd";
const FALLBACK_URL = `https://admin.alvarezplacas.com.ar/assets/${LOGO_ID}?width=400&height=400&fit=cover&format=avif`;

export const resolveProductImage = (sku, directusFileId) => {
    // 1. Prioridad: Directus Asset ID
    if (directusFileId) {
        return `https://admin.alvarezplacas.com.ar/assets/${directusFileId}?width=800&height=800&fit=cover&format=avif`;
    }

    // 2. Fallback: SKU (Solo si existe en public/images/catalog/Processed/)
    if (sku && sku !== "-") {
        const fileName = `${sku}.avif`;
        const localRelativePath = `/images/catalog/Processed/${fileName}`;
        
        // Verificación en servidor para evitar imágenes rotas
        if (typeof process !== 'undefined' && process.cwd) {
            try {
                const localAbsolutePath = path.join(process.cwd(), 'public', 'images', 'catalog', 'Processed', fileName);
                if (fs.existsSync(localAbsolutePath)) {
                    return localRelativePath;
                }
            } catch (e) {}
        } else {
            // En cliente no podemos usar fs, devolvemos la ruta y que el browser intente
            return localRelativePath;
        }
    }

    return FALLBACK_URL;
};

export { LOGO_ID, FALLBACK_URL };
