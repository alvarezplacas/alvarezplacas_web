/**
 * CubiCal PRO Hardware - V1.0
 * Reglas de cálculo de herrajes para Argentina.
 */

export const HARDWARE_RULES = {
    // Tornillos por defecto para tableros de 18mm
    SCREWS: {
        CONFIRMAT: { name: 'Tornillo Confirmat M7x50', baseQty: 12 }, // por módulo base
        AGLOMERADO: { name: 'Tornillo Aglomerado 3.5x16', baseQty: 20 } // por m2 de fondo/herrajes
    },
    
    /**
     * Calcula las correderas necesarias según profundidad.
     * @param {number} depth Profundidad del mueble (mm)
     * @param {number} qty Cantidad de cajones
     */
    getSlides: (depth, qty) => {
        // Correderas estándar vienen de 50 en 50mm (250, 300, 350, 400, 450, 500, 550)
        const availableLength = depth - 50;
        const length = Math.floor(availableLength / 50) * 50;
        const finalLength = Math.max(250, Math.min(600, length));
        
        return {
            name: `Corredera Telescópica ${finalLength}mm`,
            qty: qty, // 1 par por cajón (se cuenta como unidad de 'par' o 2 unidades)
            unit: 'Par'
        };
    },

    /**
     * Calcula cantidad de bisagras según la altura de la puerta.
     * @param {number} height Altura de la puerta (mm)
     * @param {number} doorQty Cantidad de puertas
     */
    getHinges: (height, doorQty) => {
        let perDoor = 2;
        if (height > 900) perDoor = 3;
        if (height > 1500) perDoor = 4;
        if (height > 2100) perDoor = 5;

        return {
            name: 'Bisagra Clip-on 35mm (Estándar)',
            qty: perDoor * doorQty,
            unit: 'Unidad'
        };
    },

    /**
     * Calcula tiradores según el ancho del frente.
     * @param {number} width Ancho del frente (mm)
     * @param {number} qty Cantidad de frentes (cajones o puertas)
     */
    getPulls: (width, qty) => {
        const perFront = width > 700 ? 2 : 1;
        return {
            name: 'Tirador Aluminio L-Type (200mm)',
            qty: perFront * qty,
            unit: 'Unidad'
        };
    }
};

/**
 * Genera la lista completa de herrajes para un conjunto de módulos.
 * @param {Array} modules Array de {type, dims}
 */
export function calculateTotalHardware(modules) {
    let hardwareList = {};

    function add(item) {
        if (!hardwareList[item.name]) {
            hardwareList[item.name] = { ...item };
        } else {
            hardwareList[item.name].qty += item.qty;
        }
    }

    modules.forEach(m => {
        const { type, dims } = m;
        
        // Tornillos base por módulo
        add({ name: HARDWARE_RULES.SCREWS.CONFIRMAT.name, qty: 16, unit: 'Unidad' });
        add({ name: HARDWARE_RULES.SCREWS.AGLOMERADO.name, qty: 24, unit: 'Unidad' });

        if (dims.n_cajones > 0) {
            const slides = HARDWARE_RULES.getSlides(dims.prof, dims.n_cajones);
            add(slides);
            const pulls = HARDWARE_RULES.getPulls(dims.ancho, dims.n_cajones);
            add(pulls);
        }

        if (dims.n_puertas > 0) {
            const hinges = HARDWARE_RULES.getHinges(dims.alto, dims.n_puertas);
            add(hinges);
            const pulls = HARDWARE_RULES.getPulls(dims.ancho, dims.n_puertas);
            add(pulls);
        }

        if (dims.n_estantes > 0) {
            add({ name: 'Soporte Estante Ø5mm (Taco)', qty: dims.n_estantes * 4, unit: 'Unidad' });
        }
    });

    return Object.values(hardwareList);
}
