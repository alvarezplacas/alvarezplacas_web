import { resolveProductImage } from './media.js';

/**
 * Lógica de Smart Match (Regla 60-30-10) - Versión Inteligente V16.2
 * 
 * 60% - Color Base (La placa elegida)
 * 30% - Color Secundario (Contraste o Armonía)
 * 10% - Color Acento (Destaque)
 */

export function getSmartMatch(baseProduct, allProducts = []) {
    if (!baseProduct) return null;

    const pool = allProducts.filter(p => p.foto_principal);
    const colorRealRaw = (baseProduct.color_real || "Neutro").toUpperCase();
    const nombreBase = (baseProduct.modelo || baseProduct.nombre).toUpperCase();
    
    // 1. Clasificación Tonal
    let tonalidad = "Neutro";
    if (colorRealRaw.includes("BLANCO") || colorRealRaw.includes("BEIGE") || colorRealRaw.includes("ARENA")) tonalidad = "Claro";
    else if (colorRealRaw.includes("GRIS") || colorRealRaw.includes("GRAFITO") || colorRealRaw.includes("CEMENTO")) tonalidad = "Gris";
    else if (colorRealRaw.includes("NEGRO") || colorRealRaw.includes("CARBÓN")) tonalidad = "Oscuro";
    else if (colorRealRaw.includes("MARRÓN") || colorRealRaw.includes("NOGAL") || colorRealRaw.includes("ROBLE") || colorRealRaw.includes("CEREZO")) tonalidad = "Madera";

    // 2. Selección de Complementos (60-30-10)
    let secundario = null;
    let acento = null;
    let argumentos = { base: "", secundario: "", acento: "", general: "" };

    if (tonalidad === "Madera") {
        const esVetaGris = colorRealRaw.includes("GRIS") || nombreBase.includes("GRI");
        
        if (esVetaGris) {
            // Estilo Nórdico/Industrial
            secundario = findProduct(pool, { color_real: ["Blanco", "Seda"] });
            acento = findProduct(pool, { color_real: ["Negro", "Hierro"] });
            argumentos = {
                base: "Has elegido una madera de carácter frío y contemporáneo. Sus vetas marcadas demandan un entorno que las deje respirar.",
                secundario: "Las superficies blancas o seda resaltan las vetas nórdicas, creando un lienzo de luminosidad que amplifica la textura de la madera.",
                acento: "Un toque negro o metalizado evita que el diseño pierda fuerza, anclando la estética en un estilo industrial refinado.",
                general: "Las vetas nórdicas o grisáceas resaltan con superficies blancas. Un acento oscuro evita que el ambiente pierda su alma natural y añade definición estructural."
            };
        } else {
            // Estilo Clásico/Cálido
            secundario = findProduct(pool, { color_real: ["Gris", "Grafito"] });
            acento = findProduct(pool, { color_real: ["Beige", "Arena"] });
            argumentos = {
                base: "Esta madera cálida aporta una robustez tradicional que evoca la naturaleza en su estado más puro.",
                secundario: "El gris antracita actúa como un contrapunto moderno, transformando un espacio rústico en uno de diseño editorial.",
                acento: "Detalles en tonos arena suavizan la transición, manteniendo la calidez sin sacrificar la modernidad del conjunto.",
                general: "La calidez de la madera se equilibra con grises profundos para un look contemporáneo. El acento crema aporta la luz necesaria para no saturar el espacio."
            };
        }
    } else if (tonalidad === "Claro") {
        secundario = findProduct(pool, { color_real: ["Nogal", "Roble", "Madera"] });
        acento = findProduct(pool, { color_real: ["Gris", "Negro"] });
        argumentos = {
            base: "Pureza y amplitud. Esta base clara es ideal para maximizar la luz natural y generar una sensación de orden.",
            secundario: "La madera oscura aporta la 'tierra' necesaria. Crea una jerarquía visual donde el mobiliario destaca sobre el entorno.",
            acento: "Pequeños destellos oscuros en herrajes o perfiles terminan de definir un espacio con intención arquitectónica.",
            general: "Un lienzo claro permite que las texturas de madera tomen protagonismo. El acento oscuro es el 'punto final' que cierra un diseño minimalista perfecto."
        };
    } else if (tonalidad === "Oscuro" || tonalidad === "Gris") {
        secundario = findProduct(pool, { color_real: ["Roble", "Haya", "Madera Clara"] });
        acento = findProduct(pool, { color_real: ["Blanco", "Mármol"] });
        argumentos = {
            base: "Elegancia absoluta. Los tonos profundos transmiten seguridad y un lujo silencioso que nunca pasa de moda.",
            secundario: "Maderas de tono medio rompen la monocromía, aportando la calidez orgánica que el gris o negro necesitan para ser habitables.",
            acento: "Luz puntual en blanco o texturas pétreas claras para generar dinamismo y evitar que el ambiente se sienta cerrado.",
            general: "La profundidad del oscuro se suaviza con maderas naturales. El blanco actúa como un destello de luz que realza la sofisticación del ambiente."
        };
    } else {
        // Fallback genérico inteligente
        secundario = findProduct(pool, { color_real: ["Madera"] });
        acento = findProduct(pool, { color_real: ["Gris"] });
        argumentos = {
            base: "Una elección versátil que permite múltiples interpretaciones de diseño.",
            secundario: "Elegido para aportar equilibrio visual y reducir la saturación del color principal.",
            acento: "El toque maestro. Destinado a puntos focales como detalles de diseño o accesorios.",
            general: "Combinación equilibrada de texturas naturales y tonos neutros para un ambiente funcional y estético."
        };
    }

    return {
        base: { ...formatProduct(baseProduct), argumento: argumentos.base },
        secundario: { ...formatProduct(secundario || baseProduct), argumento: argumentos.secundario },
        acento: { ...formatProduct(acento || baseProduct), argumento: argumentos.acento },
        explicacion_general: argumentos.general
    };
}

function findProduct(products, criteria) {
    if (!products || products.length === 0) return null;
    
    const matches = products.filter(p => {
        if (criteria.color_real) {
            const pColor = (p.color_real || "").toUpperCase();
            return criteria.color_real.some(c => pColor.includes(c.toUpperCase()));
        }
        return true;
    });

    if (matches.length === 0) return products[Math.floor(Math.random() * products.length)];

    return matches[Math.floor(Math.random() * matches.length)];
}

function formatProduct(p) {
    if (!p) return null;
    
    return {
        id: p.id,
        nombre: p.modelo || p.nombre,
        marca: p.marca?.nombre || "Genérica",
        linea: p.linea || "Colección V16",
        imagen: resolveProductImage(p.sku, p.foto_principal)
    };
}

