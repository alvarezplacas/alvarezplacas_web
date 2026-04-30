/**
 * Lógica de Smart Match (Regla 60-30-10) - Versión Premium V16
 * 
 * 60% - Color Base (La placa elegida)
 * 30% - Color Secundario (Contraste o Armonía)
 * 10% - Color Acento (Destaque)
 */

export function getSmartMatch(baseProduct, allProducts = []) {
    if (!baseProduct) return null;

    // Solo trabajamos con productos que tengan imagen para las sugerencias
    const pool = allProducts.filter(p => p.foto_principal);

    // Normalización de datos
    const categoria = baseProduct.rubro?.nombre || "Varios";
    const colorRealRaw = (baseProduct.color_real || "Neutro").toUpperCase();
    
    // Extraer categoría de color (Blanco, Gris, Negro, Marrón, etc.)
    let colorBase = "Neutro";
    if (colorRealRaw.includes("BLANCO")) colorBase = "Blanco";
    else if (colorRealRaw.includes("GRIS")) colorBase = "Gris";
    else if (colorRealRaw.includes("NEGRO")) colorBase = "Negro";
    else if (colorRealRaw.includes("MARRÓN") || colorRealRaw.includes("NOGAL") || colorRealRaw.includes("ROBLE") || colorRealRaw.includes("CEREZO")) colorBase = "Madera";
    else if (colorRealRaw.includes("BEIGE") || colorRealRaw.includes("ARENA")) colorBase = "Beige";

    let secundario = null;
    let acento = null;
    let argBase = "";
    let argSecundario = "";
    let argAcento = "";

    // LÓGICA DE ARGUMENTACIÓN INTELIGENTE
    if (colorBase === "Madera") {
        // MADERAS -> Contraste Neutro -> Acento Luz
        secundario = findProduct(pool, { color_real: ["Gris", "Negro"] });
        acento = findProduct(pool, { color_real: ["Blanco"] });
        
        argBase = "Has elegido una base orgánica y cálida. La madera es el alma de cualquier ambiente, aportando textura y una sensación de confort atemporal.";
        argSecundario = "Elegido para aportar equilibrio visual; un tono neutro profundo reduce la saturación de la madera y añade sofisticación.";
        argAcento = "El toque final de luminosidad. El blanco puro resalta las vetas naturales y evita que el diseño se sienta pesado.";
        
    } else if (colorBase === "Blanco" || colorBase === "Beige") {
        // BLANCOS/BEIGES -> Contraste Madera -> Acento Oscuro
        secundario = findProduct(pool, { color_real: ["Marrón", "Nogal", "Roble"] });
        acento = findProduct(pool, { color_real: ["Negro", "Gris"] });

        argBase = "Una base clara amplifica el espacio y la luz. Es el lienzo perfecto para un diseño minimalista o escandinavo.";
        argSecundario = "La madera aporta la calidez necesaria para romper la frialdad del blanco, creando un ambiente acogedor y habitable.";
        argAcento = "Detalles oscuros que definen la estructura. Un acento fuerte crea puntos de enfoque y añade carácter al conjunto.";

    } else if (colorBase === "Negro" || colorBase === "Gris") {
        // OSCUROS -> Contraste Madera Clara -> Acento Blanco/Metal
        secundario = findProduct(pool, { color_real: ["Beige", "Roble", "Haya"] });
        acento = findProduct(pool, { color_real: ["Blanco"] });

        argBase = "Una elección audaz y elegante. Los tonos oscuros transmiten lujo y modernidad, creando una atmósfera envolvente.";
        argSecundario = "Maderas claras o tonos arena suavizan la intensidad del oscuro, manteniendo la elegancia pero con una nota de calidez natural.";
        argAcento = "Contraste máximo para iluminar áreas específicas. El blanco actúa como un destello que realza la profundidad de los grises.";

    } else {
        // FALLBACK
        secundario = findProduct(pool, { color_real: ["Gris"] });
        acento = findProduct(pool, { color_real: ["Blanco"] });
        
        argBase = "Un diseño equilibrado basado en la sobriedad. Ideal para quienes buscan una estética limpia y funcional.";
        argSecundario = "El gris medio actúa como un puente tonal, suavizando las transiciones entre materiales.";
        argAcento = "Luz puntual para destacar el diseño sin sobrecargarlo.";
    }

    return {
        base: { ...formatProduct(baseProduct), argumento: argBase },
        secundario: { ...formatProduct(secundario || baseProduct), argumento: argSecundario },
        acento: { ...formatProduct(acento || baseProduct), argumento: argAcento },
        explicacion_general: `${argBase} ${argSecundario}`
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
    const LOGO_ID = "209a486b-8623-4c3e-8f8e-2a3288f1f0fd";
    const imgId = p.foto_principal;
    
    return {
        id: p.id,
        nombre: p.modelo || p.nombre,
        marca: p.marca?.nombre || "Genérica",
        linea: p.linea || "Colección V16",
        imagen: imgId 
            ? `https://admin.alvarezplacas.com.ar/assets/${imgId}?width=800&height=800&fit=cover&format=avif` 
            : `https://admin.alvarezplacas.com.ar/assets/${LOGO_ID}?width=800&height=800&fit=cover`
    };
}
