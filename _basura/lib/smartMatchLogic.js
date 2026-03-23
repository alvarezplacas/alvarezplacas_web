/**
 * Lógica de Smart Match (Regla 60-30-10)
 * 
 * 60% - Color Base (La placa elegida)
 * 30% - Color Secundario (Contraste o Armonía)
 * 10% - Color Acento (Destaque)
 */

import placasData from '../data/placas.json';

export function getSmartMatch(placaId) {
    const basePlaca = placasData.find(p => p.id === placaId);
    if (!basePlaca) return null;

    const { categoria, tono, color, marca } = basePlaca;

    let secundario = null;
    let acento = null;
    let explicacion = "";

    // Lógica por categoría
    if (categoria === "Madera") {
        if (tono === "Cálido") {
            // Base cálida -> Secundario Textil o Liso Neutro -> Acento Negro/Piedra
            secundario = findPlaca({ categoria: "Textil", tono: "Frío" }) || findPlaca({ categoria: "Liso", color: "Gris" });
            acento = findPlaca({ categoria: "Piedra", color: "Negro" }) || findPlaca({ categoria: "Liso", color: "Negro" });
            explicacion = "La calidez de la madera armoniza perfectamente con texturas textiles neutras, mientras que un toque de piedra oscura aporta elegancia y modernidad.";
        } else {
            // Madera Fría -> Secundario Liso Blanco/Gris -> Acento Madera Cálida
            secundario = findPlaca({ categoria: "Liso", color: "Blanco" });
            acento = findPlaca({ categoria: "Madera", tono: "Cálido" });
            explicacion = "Las maderas nórdicas o grisáceas resaltan con superficies blancas puras. Un acento en madera cálida evita que el ambiente se sienta frío.";
        }
    } else if (categoria === "Piedra") {
        // Piedra -> Secundario Madera -> Acento Liso
        secundario = findPlaca({ categoria: "Madera" });
        acento = findPlaca({ categoria: "Liso" });
        explicacion = "La robustez de la piedra se equilibra con la naturalidad de la madera, creando un espacio orgánico y sofisticado.";
    } else if (categoria === "Liso") {
        if (color === "Blanco" || color === "Gris") {
            secundario = findPlaca({ categoria: "Madera", tono: "Cálido" });
            acento = findPlaca({ categoria: "Piedra" });
            explicacion = "Sobre una base neutra, la madera aporta la calidez necesaria para habitar el espacio, y la piedra el detalle de lujo.";
        } else {
            secundario = findPlaca({ categoria: "Madera" });
            acento = findPlaca({ categoria: "Liso", color: "Blanco" });
            explicacion = "Los colores sólidos cobran vida al ser enmarcados por vets naturales y detalles en blanco puro.";
        }
    } else {
        // Fallback
        secundario = findPlaca({ categoria: "Liso", color: "Gris" });
        acento = findPlaca({ categoria: "Liso", color: "Blanco" });
        explicacion = "Una combinación equilibrada de tonos neutros que garantiza sobriedad y buen gusto en cualquier ambiente.";
    }

    return {
        base: basePlaca,
        secundario: secundario || basePlaca, // Fallback a si misma si no hay datos
        acento: acento || basePlaca,
        explicacion
    };
}

function findPlaca(criteria) {
    return placasData.find(p => {
        let match = true;
        if (criteria.categoria && p.categoria !== criteria.categoria) match = false;
        if (criteria.tono && p.tono !== criteria.tono) match = false;
        if (criteria.color && !p.color.toLowerCase().includes(criteria.color.toLowerCase())) match = false;
        return match;
    });
}
