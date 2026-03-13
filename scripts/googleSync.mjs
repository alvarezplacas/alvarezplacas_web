import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Configuración
const SPREADSHEET_ID = '16UwHCGUbhox7AVVoXLdQiKdw2lFevrBxeOWBhHA_8Dc';
const TABS = ['PLACAS', 'HERRAJES', 'QUIMICOS', 'HERRAMIENTAS ELECTRICAS', 'OTROS'];
const CREDENTIALS_PATH = path.resolve('credentials.json');
const OUTPUT_PATH = path.resolve('biblioteca/master_catalog.json');
const PLACAS_REFERENCE_PATH = path.resolve('src/data/placas.json');

// Cargar referencia de placas para imágenes
let placasReference = [];
if (fs.existsSync(PLACAS_REFERENCE_PATH)) {
    placasReference = JSON.parse(fs.readFileSync(PLACAS_REFERENCE_PATH, 'utf-8'));
}

async function getSheetsData(auth, range) {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${range}!A:E`,
        });
        return response.data.values || [];
    } catch (err) {
        console.error(`Error leyendo pestaña ${range}:`, err.message);
        return [];
    }
}

function findPlacaImage(code, name) {
    if (!code) return null;
    // Buscar por código exacto (W954, etc)
    let match = placasReference.find(p => p.codigo === code);
    if (!match) {
        // Buscar por nombre si el código no coincide
        const cleanName = name.toLowerCase();
        match = placasReference.find(p => cleanName.includes(p.nombre.toLowerCase()));
    }
    return match ? { imagen: match.imagen, brand: match.marca } : null;
}

function intelligentParse(input, category, codeFromSheet) {
    const raw = input.toUpperCase().trim();
    const result = {
        original: input,
        brand: "Generico",
        category: category,
        name: "",
        specs: [],
        price: "",
        code: codeFromSheet || ""
    };

    // 1. Detección de Marca (Mejorada)
    const brands = {
        'EGGER': 'Egger',
        'FAPLAC': 'Faplac',
        'SADEPAN': 'Sadepan',
        'EUROHARD': 'Eurohard',
        'KEKOL': 'Kekol',
        'EINHELL': 'Einhell',
        'GOLA': 'Gola',
        'FIPLASTOS': 'Fiplastos',
        'GUILLERMINA': 'Guillermina',
        'RASSER': 'Rasser',
        'MACAVI': 'Macavi',
        'CUBERT': 'Cubert',
        'GOLPINT': 'Golpint'
    };

    for (const [key, value] of Object.entries(brands)) {
        if (raw.includes(key)) {
            result.brand = value;
            break;
        }
    }

    // 2. Restauración de Imágenes para Placas
    if (category === 'PLACAS' || result.brand === 'Egger' || result.brand === 'Faplac' || result.brand === 'Sadepan') {
        const placaMatch = findPlacaImage(codeFromSheet, input);
        if (placaMatch) {
            result.imagen = placaMatch.imagen;
            result.brand = placaMatch.brand;
            result.localMatch = true;
        } else {
            // Lógica por defecto: Intentar construir ruta basada en nombre limpio y marca
            // Formato: /images/catalog/[Marca]/[Nombre].avif
            const brandFolder = result.brand;
            const cleanNameForImage = result.name.replace(/\//g, "-"); // Evitar problemas con / en nombres
            result.imagen = `/images/catalog/${brandFolder}/${cleanNameForImage}.avif`;
            result.localMatch = true; // Asumimos que si la suben con ese nombre, funcionará
        }
    } else {
        result.localMatch = false;
    }

    // 3. Extracción de Medidas y Materiales
    const measurements = raw.match(/\d+MM|\d+/g) || [];
    const materials = [];
    if (raw.includes("MDF")) materials.push("MDF");
    if (raw.includes("AGLO")) materials.push("AGLO");
    if (raw.includes("FIBROPLUS")) materials.push("FIBROPLUS");

    result.specs = [...new Set([...measurements, ...materials])];

    // 4. Limpieza del Nombre
    let cleanName = raw;
    Object.keys(brands).concat(["HERRAJES", "MDF", "AGLO", "FIBROPLUS", "NOVA", "PLACAS", "HERRAMIENTA"]).forEach(k => {
        cleanName = cleanName.replace(new RegExp(k, 'g'), "");
    });

    cleanName = cleanName.replace(/\d+MM|\d+/g, "")
        .replace(/\+/g, " ")
        .replace(/'/g, "")
        .replace(/\s+/g, " ")
        .trim();

    result.name = cleanName || raw; // Fallback al original si la limpieza es agresiva
    return result;
}

async function runSync() {
    console.log('--- Iniciando Sincronización Multi-Pestaña con Restauración de Imágenes ---');

    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    try {
        let fullCatalog = [];

        for (const tab of TABS) {
            console.log(`Procesando pestaña: ${tab}...`);
            const rows = await getSheetsData(auth, tab);

            if (rows.length <= 1) continue;

            const dataRows = rows.slice(1);
            const tabItems = dataRows.map(row => {
                if (!row[1]) return null;

                const code = row[0];
                const articuloStr = row[1];
                const precioEfectivo = row[2];
                const precioTransf = row[3];
                const ultimaAct = row[4];

                const parsed = intelligentParse(articuloStr, tab, code);
                parsed.price = precioEfectivo || "";
                parsed.priceTransferencia = precioTransf || "";
                parsed.lastUpdate = ultimaAct || "";
                parsed.status = "Sincronizado";

                return parsed;
            }).filter(Boolean);

            fullCatalog = [...fullCatalog, ...tabItems];
        }

        if (!fs.existsSync('biblioteca')) fs.mkdirSync('biblioteca');
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fullCatalog, null, 2));

        console.log(`✅ Sincronización completada. ${fullCatalog.length} productos totales.`);
        const withImages = fullCatalog.filter(i => i.localMatch).length;
        console.log(`📸 Imágenes restauradas: ${withImages}`);
        console.log(`Archivo guardado en: ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('Error en la sincronización:', error.message);
    }
}

runSync();
