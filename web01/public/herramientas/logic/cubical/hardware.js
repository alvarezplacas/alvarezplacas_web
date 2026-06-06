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
    getSlides: (depth, qty, runnerType = 'telescopica') => {
        // Correderas estándar vienen de 50 en 50mm (250, 300, 350, 400, 450, 500, 550)
        const availableLength = depth - 50;
        const length = Math.floor(availableLength / 50) * 50;
        const finalLength = Math.max(250, Math.min(600, length));
        
        const name = runnerType === 'comun_z'
            ? `Corredera Común / Z ${finalLength}mm (Bronzen)`
            : `Corredera Telescópica ${finalLength}mm (Greenway/Bronzen)`;
        
        return {
            name,
            qty: qty, // 1 par por cajón
            unit: 'Par'
        };
    },

    /**
     * Calcula cantidad de bisagras según la altura de la puerta.
     * @param {number} height Altura de la puerta (mm)
     * @param {number} doorQty Cantidad de puertas
     */
    /**
     * Calcula cantidad de bisagras según la altura de la puerta y tipo de montaje (codo).
     * @param {number} height Altura de la puerta (mm)
     * @param {number} doorQty Cantidad de puertas
     * @param {string} hingeType Tipo de bisagra: 'codo_0', 'codo_9', 'codo_18'
     */
    getHinges: (height, doorQty, hingeType = 'codo_0') => {
        let perDoor = 2;
        if (height > 900) perDoor = 3;
        if (height > 1500) perDoor = 4;
        if (height > 2100) perDoor = 5;

        let name = 'Bisagra Cazoleta 35mm Codo 0 - Superpuesta (Greenway/Bronzen)';
        if (hingeType === 'codo_9') {
            name = 'Bisagra Cazoleta 35mm Codo 9 - Semi-superpuesta (Greenway/Bronzen)';
        } else if (hingeType === 'codo_18') {
            name = 'Bisagra Cazoleta 35mm Codo 18 - Embutida (Greenway/Bronzen)';
        }

        return {
            name,
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
            name: 'Tirador Clásico Atornillable (Bronzen)',
            qty: perFront * qty,
            unit: 'Unidad'
        };
    }
};

/**
 * Genera la lista completa de herrajes para un conjunto de módulos.
 * @param {Array} modules Array de {type, dims, hingeType}
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
            let mult = 1;
            if (type !== 'RACK_TV' && type !== 'ESCRITORIO') {
                const forceDivider = m.divider === 'si';
                const preventDivider = m.divider === 'no';
                const hasDivider = !preventDivider && (forceDivider || (dims.n_puertas >= 3) || ['izq', 'der', 'ambos'].includes(m.drawerLayout) || ['izq', 'der', 'ambos'].includes(m.doorLayout));
                mult = (m.drawerLayout === 'ambos' && hasDivider) ? 2 : 1;
            }
            
            const slides = HARDWARE_RULES.getSlides(dims.prof, dims.n_cajones * mult, m.runnerType || 'telescopica');
            add(slides);
            const pulls = HARDWARE_RULES.getPulls(dims.ancho, dims.n_cajones * mult);
            add(pulls);
        }

        if (dims.n_puertas > 0) {
            const hinges = HARDWARE_RULES.getHinges(dims.alto, dims.n_puertas, m.hingeType || 'codo_0');
            add(hinges);
            const pulls = HARDWARE_RULES.getPulls(dims.ancho, dims.n_puertas);
            add(pulls);
        }

        if (dims.n_estantes > 0) {
            add({ name: 'Soporte Estante Ø5mm (Taco)', qty: dims.n_estantes * 4, unit: 'Unidad' });
        }
        if (type === 'ESCRITORIO') {
            // Bandeja de teclado requiere correderas extra
            const traySlides = HARDWARE_RULES.getSlides(dims.prof, 1);
            add(traySlides);
        }

        if (type === 'ALACENA' && dims.n_puertas > 0) {
            // Asumimos puertas elevables (Pistón a gas)
            const wPuerta = Math.floor((dims.ancho - (dims.n_puertas * 2)) / dims.n_puertas);
            const pistonsPerDoor = wPuerta > 600 ? 2 : 1;
            add({ name: 'Pistón a Gas 80N (Bronzen/Greenway)', qty: pistonsPerDoor * dims.n_puertas, unit: 'Unidad' });
        }
    });

    return Object.values(hardwareList);
}

