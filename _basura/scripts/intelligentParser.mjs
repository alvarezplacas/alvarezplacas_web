/**
 * ARCHIVO DE PRUEBA: Algoritmo de Extracción Inteligente
 * Este script demuestra cómo podemos separar marca, categoría, color y medidas
 * de una sola cadena de texto "sucia".
 */

const testCases = [
    "BLANCO EGGER 18MM AGLO",
    "BLANCO FAPLAC 15MM MDF",
    "FIBROPLUS BLANCO 3MM",
    "MDF 18MM 275",
    "GUILLERMINA NOVA 366 9MM",
    "EGGER 'GRUPO 2' 18MM AGLO",
    "Herrajes gola picaporte 15"
];

function intelligentParse(input) {
    const raw = input.toUpperCase().trim();
    const result = {
        original: input,
        brand: "Generico",
        category: "Placas",
        name: "",
        specs: []
    };

    // 1. Detección de Categoría
    if (raw.includes("HERRAJES")) result.category = "Herrajes";
    else if (raw.includes("MDF") || raw.includes("AGLO") || raw.includes("FIBROPLUS") || raw.includes("NOVA")) result.category = "Placas";

    // 2. Detección de Marca
    if (raw.includes("EGGER")) result.brand = "Egger";
    else if (raw.includes("FAPLAC")) result.brand = "Faplac";
    else if (raw.includes("SADEPAN")) result.brand = "Sadepan";
    else if (raw.includes("GOLA") || result.category === "Herrajes") result.brand = "Gola";

    // 3. Extracción de Medidas (ej: 18MM, 3MM, 366)
    const measurements = raw.match(/\d+MM|\d+/g) || [];
    result.specs = measurements;

    // 4. Limpieza del Nombre (quitamos marcas y medidas detectadas)
    let cleanName = raw;
    ["EGGER", "FAPLAC", "SADEPAN", "GOLA", "HERRAJES", "MDF", "AGLO", "FIBROPLUS"].forEach(k => {
        cleanName = cleanName.replace(k, "");
    });
    // Quitamos números sueltos y espacios extras
    cleanName = cleanName.replace(/\d+MM|\d+/g, "").replace(/\s+/g, " ").trim();

    result.name = cleanName || "Sin Nombre";

    return result;
}

console.log("--- RESULTADOS DEL PARSEO INTELIGENTE ---");
testCases.forEach(str => {
    const parsed = intelligentParse(str);
    console.log(`\nENTRADA: "${str}"`);
    console.log(`   -> MARCA: ${parsed.brand}`);
    console.log(`   -> CATEGORÍA: ${parsed.category}`);
    console.log(`   -> NOMBRE/DETALLE: ${parsed.name}`);
    console.log(`   -> ESPECIFICACIONES: ${parsed.specs.join(", ")}`);
});
