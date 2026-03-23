import { catalogItemsStore } from '../../catalog/store.js';
import placasData from '../../../data/placas.json';

/**
 * Lógica de Smart Match (Regla 60-30-10)
 */
export function getSmartMatch(placaId) {
    const basePlaca = placasData.find(p => p.id === placaId);
    if (!basePlaca) return null;

    const { categoria, tono, color } = basePlaca;

    let secundario = null;
    let acento = null;
    let explicacion = "";

    // Lógica por categoría (Simplificada para el ejemplo, pero puede crecer aquí)
    if (categoria === "Madera") {
        if (tono === "Cálido") {
            secundario = findPlaca({ categoria: "Textil", tono: "Frío" }) || findPlaca({ categoria: "Liso", color: "Gris" });
            acento = findPlaca({ categoria: "Piedra", color: "Negro" }) || findPlaca({ categoria: "Liso", color: "Negro" });
            explicacion = "La calidez de la madera armoniza perfectamente con texturas textiles neutras, mientras que un toque de piedra oscura aporta elegancia y modernidad.";
        } else {
            secundario = findPlaca({ categoria: "Liso", color: "Blanco" });
            acento = findPlaca({ categoria: "Madera", tono: "Cálido" });
            explicacion = "Las maderas nórdicas o grisáceas resaltan con superficies blancas puras. Un acento en madera cálida evita que el ambiente se sienta frío.";
        }
    } else if (categoria === "Piedra") {
        secundario = findPlaca({ categoria: "Madera" });
        acento = findPlaca({ categoria: "Liso" });
        explicacion = "La robustez de la piedra se equilibra con la naturalidad de la madera, creando un espacio orgánico y sofisticado.";
    } else {
        secundario = findPlaca({ categoria: "Liso", color: "Gris" });
        acento = findPlaca({ categoria: "Liso", color: "Blanco" });
        explicacion = "Una combinación equilibrada de tonos neutros que garantiza sobriedad y buen gusto en cualquier ambiente.";
    }

    return {
        base: basePlaca,
        secundario: secundario || basePlaca,
        acento: acento || basePlaca,
        explicacion
    };
}

function findPlaca(criteria) {
    return placasData.find(p => {
        let match = true;
        if (criteria.categoria && p.categoria !== criteria.categoria) match = false;
        if (criteria.tono && p.tono !== criteria.tono) match = false;
        if (criteria.color && !p.color?.toLowerCase().includes(criteria.color.toLowerCase())) match = false;
        return match;
    });
}
