/**
 * CubiCal PRO - Catálogo de Plantillas Dinámicas
 * Modifica o agrega nuevas plantillas aquí sin tocar el código principal del Visualizador.
 */
export const TEMPLATES = {
    CHIFONIER: {
        id: 'CHIFONIER',
        name: "Chifonier Cajonera",
        emoji: "🗄️",
        tag: "5 Cajones",
        tagColor: "var(--alvarez-red)",
        description: "Ideal para dormitorios. Optimización de altura y guías de precisión de 450mm.",
        environment: 'dormitorio',
        modType: 'CAJONERA',
        dims: { alto: 1200, ancho: 600, prof: 500, n_cajones: 5, n_puertas: 0, n_estantes: 0 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Chifonier Principal"
    },
    BAJO_MESADA: {
        id: 'BAJO_MESADA',
        name: "Bajo Mesada Cocina",
        emoji: "🍽️",
        tag: "2 Puertas",
        tagColor: "var(--alvarez-blue)",
        description: "Estructura clásica para cocina con zócalo elevado de 120mm y piso reforzado.",
        environment: 'cocina',
        modType: 'BAJO_MESADA',
        dims: { alto: 850, ancho: 800, prof: 560, n_cajones: 0, n_puertas: 2, n_estantes: 0 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Bajo Mesada"
    },
    ALACENA: {
        id: 'ALACENA',
        name: "Alacena Almacén",
        emoji: "🪜",
        tag: "Estantes",
        tagColor: "#10b981", // Emerald-500
        description: "Módulo superior de alacena con puertas colgantes y 2 estantes regulables.",
        environment: 'cocina',
        modType: 'ALACENA',
        dims: { alto: 600, ancho: 800, prof: 300, n_cajones: 0, n_puertas: 2, n_estantes: 2 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Alacena Superior"
    },
    ROPERO: {
        id: 'ROPERO',
        name: "Placard Vestidor",
        emoji: "🚪",
        tag: "Placard Abierto",
        tagColor: "#f59e0b", // Amber-500
        description: "Estructura espaciosa para colgar y estantes organizadores profundos.",
        environment: 'dormitorio',
        modType: 'PLACARD',
        dims: { alto: 2100, ancho: 1000, prof: 600, n_cajones: 0, n_puertas: 2, n_estantes: 3 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Placard Vestidor"
    },
    BIBLIOTECA: {
        id: 'BIBLIOTECA',
        name: "Biblioteca Hogar",
        emoji: "📚",
        tag: "4 Estantes",
        tagColor: "#6366f1", // Indigo-500
        description: "Librero vertical esbelto con estantes de carga reforzados para salas u oficinas.",
        environment: 'oficina',
        modType: 'BIBLIOTECA',
        dims: { alto: 1800, ancho: 800, prof: 300, n_cajones: 0, n_puertas: 0, n_estantes: 4 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Biblioteca"
    },
    VANITORY: {
        id: 'VANITORY',
        name: "Vanitory de Baño",
        emoji: "🚿",
        tag: "2 Cajones",
        tagColor: "#14b8a6", // Teal-500
        description: "Módulo suspendido moderno para baño con espacio superior para bacha.",
        environment: 'baño',
        modType: 'CAJONERA',
        dims: { alto: 800, ancho: 600, prof: 450, n_cajones: 2, n_puertas: 0, n_estantes: 0 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Vanitory Baño"
    },
    RACK_TV: {
        id: 'RACK_TV',
        name: "Rack TV Comedor",
        emoji: "📺",
        tag: "Bajo TV",
        tagColor: "#f43f5e", // Rose-500
        description: "Centro de entretenimiento de baja altura con 2 puertas y estante central de audio.",
        environment: 'living',
        modType: 'RACK_TV', // Cambiado de BAJO_MESADA a RACK_TV
        dims: { alto: 550, ancho: 1400, prof: 400, n_cajones: 2, n_puertas: 2, n_estantes: 1 },
        customVars: { colCenterWidth: 600 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Rack TV Moderno"
    },
    ESCRITORIO: {
        id: 'ESCRITORIO',
        name: "Escritorio Trabajo",
        emoji: "💻",
        tag: "Estudio",
        tagColor: "#06b6d4", // Cyan-500
        description: "Escritorio juvenil con faldón trasero, bandeja para teclado y cajonera derecha de 4 cajones (400mm).",
        environment: 'oficina',
        modType: 'ESCRITORIO',
        dims: { alto: 750, ancho: 1200, prof: 600, n_cajones: 4, n_puertas: 0, n_estantes: 0 },
        customVars: { cajoneraWidth: 400 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Escritorio"
    },
    DESPENSA: {
        id: 'DESPENSA',
        name: "Despensa Cocina",
        emoji: "🥫",
        tag: "Almacenaje",
        tagColor: "#059669", // Emerald-600
        description: "Módulo de despensa alta y esbelta con 2 puertas y 4 estantes internos fijos.",
        environment: 'cocina',
        modType: 'PLACARD',
        dims: { alto: 2000, ancho: 600, prof: 400, n_cajones: 0, n_puertas: 2, n_estantes: 4 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Despensa Alta"
    },
    RACK_TV_GRANDE: {
        id: 'RACK_TV_GRANDE',
        name: "Rack TV Grande (TV8018)",
        emoji: "📺",
        tag: "1.70 metros",
        tagColor: "var(--alvarez-red)",
        description: "Mesa para TV LED extra ancha basada en el catálogo de Fiplasto. Cuenta con espacio para consolas y parlantes.",
        environment: 'living',
        modType: 'RACK_TV',
        dims: { alto: 523, ancho: 1700, prof: 468, n_cajones: 2, n_puertas: 2, n_estantes: 1 },
        customVars: { colCenterWidth: 700 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Rack TV Extra Grande"
    },
    MESA_RATONA: {
        id: 'MESA_RATONA',
        name: "Mesa Ratona (ME8024)",
        emoji: "☕",
        tag: "Mesa de Centro",
        tagColor: "#eab308",
        description: "Mesa baja para living de 90x60cm. Altura ergonómica de 48.8cm con un práctico cajón deslizable.",
        environment: 'living',
        modType: 'CAJONERA',
        dims: { alto: 488, ancho: 905, prof: 605, n_cajones: 1, n_puertas: 0, n_estantes: 1 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Mesa de Centro"
    },
    BIBLIOTECA_PUERTAS: {
        id: 'BIBLIOTECA_PUERTAS',
        name: "Biblioteca con Puertas (BL0401)",
        emoji: "📚",
        tag: "Puertas y Estantes",
        tagColor: "#6366f1",
        description: "Biblioteca alta basada en el catálogo de Fiplasto de 60cm de ancho con 4 estantes superiores y 2 puertas.",
        environment: 'oficina',
        modType: 'BIBLIOTECA',
        dims: { alto: 1790, ancho: 600, prof: 300, n_cajones: 0, n_puertas: 2, n_estantes: 4 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Biblioteca con Puertas"
    },
    COMODA_TRES: {
        id: 'COMODA_TRES',
        name: "Cómoda 3 Cajones (CO3503)",
        emoji: "🗄️",
        tag: "3 Cajones",
        tagColor: "var(--alvarez-red)",
        description: "Cómoda clásica de cajones profundos basada en el catálogo de Fiplasto de 90x45cm con correderas seleccionables.",
        environment: 'dormitorio',
        modType: 'CAJONERA',
        dims: { alto: 760, ancho: 900, prof: 450, n_cajones: 3, n_puertas: 0, n_estantes: 0 },
        hingeType: 'codo_0',
        moduleName: "Modulo A1 - Cómoda 3 Cajones"
    }
};
