/**
 * Lógica de Smart Match (Regla 60-30-10) - Versión Directus v16
 * 
 * 60% - Color Base (La placa elegida)
 * 30% - Color Secundario (Contraste o Armonía)
 * 10% - Color Acento (Destaque)
 */

export function getSmartMatch(baseProduct, allProducts = []) {
    if (!baseProduct) return null;

    // Campos normalizados desde Directus
    const categoria = baseProduct.rubro?.nombre || "Varios";
    const color_real = baseProduct.color_real || "Neutro";
    const marca = baseProduct.marca?.nombre || "Genérica";

    let secundario = null;
    let acento = null;
    let explicacion = "";

    // Lógica por categoría (Rubro)
    if (categoria.includes("Maderas") || categoria.includes("Tableros")) {
        if (color_real === "Marrón" || color_real === "Beige") {
            // Maderas cálidas -> Secundario Gris/Negro -> Acento Blanco
            secundario = findProduct(allProducts, { color_real: "Gris" }) || findProduct(allProducts, { color_real: "Negro" });
            acento = findProduct(allProducts, { color_real: "Blanco" });
            explicacion = "La calidez de la madera armoniza perfectamente con texturas neutras, mientras que un toque de blanco puro aporta luz y modernidad.";
        } else {
            // Maderas frías/oscuras -> Secundario Blanco -> Acento Marrón
            secundario = findProduct(allProducts, { color_real: "Blanco" });
            acento = findProduct(allProducts, { color_real: "Marrón" });
            explicacion = "Las vetas nórdicas o grisáceas resaltan con superficies blancas. Un acento en madera clásica evita que el ambiente pierda su alma natural.";
        }
    } else if (color_real === "Blanco" || color_real === "Gris") {
        // Base Neutra -> Secundario Madera -> Acento Negro/Color
        secundario = findProduct(allProducts, { color_real: "Marrón" });
        acento = findProduct(allProducts, { color_real: "Negro" }) || findProduct(allProducts, { color_real: "Azul" });
        explicacion = "Sobre una base neutra, la madera aporta la calidez necesaria, y los detalles oscuros definen las líneas del diseño.";
    } else {
        // Fallback
        secundario = findProduct(allProducts, { color_real: "Gris" });
        acento = findProduct(allProducts, { color_real: "Blanco" });
        explicacion = "Una combinación equilibrada de tonos que garantiza sobriedad y buen gusto en cualquier ambiente.";
    }

    return {
        base: formatProduct(baseProduct),
        secundario: formatProduct(secundario || baseProduct),
        acento: formatProduct(acento || baseProduct),
        explicacion
    };
}

function findProduct(products, criteria) {
    if (!products || products.length === 0) return null;
    
    // Filtramos los que coinciden con el criterio
    const matches = products.filter(p => {
        if (criteria.color_real) {
            const pColor = (p.color_real || "").toLowerCase();
            const targetColor = criteria.color_real.toLowerCase();
            if (!pColor.includes(targetColor) && !targetColor.includes(pColor)) return false;
        }
        return true;
    });

    if (matches.length === 0) return null;

    // Priorizamos los que tienen foto_principal
    const withPhoto = matches.filter(p => p.foto_principal);
    if (withPhoto.length > 0) {
        return withPhoto[Math.floor(Math.random() * withPhoto.length)];
    }

    // Si ninguno tiene foto, devolvemos uno al azar de los que coinciden
    return matches[Math.floor(Math.random() * matches.length)];
}

function formatProduct(p) {
    if (!p) return null;
    const LOGO_ID = "209a486b-8623-4c3e-8f8e-2a3288f1f0fd";
    const imgId = p.foto_principal;
    
    return {
        id: p.id,
        nombre: p.nombre || p.modelo,
        marca: p.marca?.nombre || "Genérica",
        linea: p.linea || "Colección V16",
        imagen: imgId 
            ? `https://admin.alvarezplacas.com.ar/assets/${imgId}?width=600&height=600&fit=cover` 
            : `https://admin.alvarezplacas.com.ar/assets/${LOGO_ID}`
    };
}
