import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '16UwHCGUbhox7AVVoXLdQiKdw2lFevrBxeOWBhHA_8Dc';
const CREDENTIALS_PATH = path.resolve('credentials.json');

const CATEGORIES = {
    PLACAS: ['EGGER', 'FAPLAC', 'FIPLASTOS', 'ENCHAPADO', 'SADEPAN', 'GUILLERMINA', 'MDF', 'AGLO', 'FIBROPLUS', 'NOVA', 'TAPA', 'PANEL RANURADO', 'PANEL', 'CANTO', 'ABS', 'SUPREME BOARD', 'PLACAS'],
    'HERRAMIENTAS ELECTRICAS': ['EINHELL', 'TALADRO', 'AMOLADORA', 'SIERRA', 'LIJADORA', 'HERRAMIENTA', 'MECHA', 'DISCO', 'PINZA', 'DESTORNILLADOR', 'NIVEL', 'METRO', 'ASPIRADORA', 'SOPLADOR', 'MARTILLO', 'BATERIA', 'BATERÍA', 'CARGADOR', 'INGLETEADORA', 'CEPILLADORA', 'COMPRESOR', 'LINTERNA', 'ENGALLETADORA', 'BOMBA', 'CE-AP', 'TE-AP', 'INALAMBRICA', 'INALÁMBRICA', 'CORTACERCO', 'RECORORTADORA', 'MOTOSIERRA', 'PODADORA', 'PUNTEADORA', 'ATORNILLADOR', 'CLAVADORA', 'NEUMATICA', 'NEUMÁTICA', 'FRESA'],
    QUIMICOS: ['KEKOL', 'RASSER', 'MACAVI', 'CUBERT', 'GOLPINT', 'ADHESIVO', 'COLA', 'PEGAMENTO', 'SILICONA', 'PUR', 'SELLADOR', 'LACA', 'BARNIZ', 'THINNER', 'SOLVENTE', 'BORDE', 'MEMBRANA', 'HIDROFUGO', 'HIDROESMALTE', 'DILUYENTE', 'LIMPIADOR', 'REDUCPUR', 'REMATADOR', 'REVESTIMIENTO', 'MASILLA', 'IMPRIMADOR', 'FIJADOR', 'PINTURA', 'HIDRESMALT', 'HIDROLACA', 'K-100', 'K-12', 'K-403', 'KL-790', 'CETOL', 'LASUR', 'PROTECTOR', 'IMPREGNANTE', 'KH-60', 'K-5060', 'HIDROSLOT', 'DANKE', 'ESMALTE', 'ACRILICO', 'LUSTRE', 'MICROCEMENTO', 'MONOCOMPONENTE', 'REGULADOR', 'HUMEDAD', 'K-1126', 'HOT MELT', 'FLEXRA', 'ENDUIDO', 'LATEX', 'FORMA 50', 'FORMA50', 'HIDROLAVADORA', 'REMOVEDOR', 'ADITIVO', 'CALAFATEO', 'SABER', 'ESTUCO', 'GLASE', 'GLASÉ', 'PATINA', 'CEMENTO', 'TINTA', 'CLEANER', 'CORRECTOR', 'SILICATO', 'TRATAMIENTO', 'AUTOBRILLO', 'ATRAPANTE', 'PASTA', 'NITROCELULOSA', 'POLIURETANICA', 'CATALIZADOR', 'LUSTRAMUEBLES', 'ESPUMA'],
    HERRAJES: ['GOLA', 'ZOCALO', 'MANIJA', 'BISAGRA', 'GUIA', 'CORREDERA', 'TIRADOR', 'HERRAJE', 'PIVOT', 'PICAPORTE', 'TORNILLO', 'SOPORTE', 'PERFIL', 'SISTEMA', 'KIT', 'MENSULA', 'COLGADOR', 'PERCHA', 'ESTANTE', 'RUEDA', 'PATIN', 'PIE', 'PATA', 'CERRADURA', 'LLAVE', 'RETEN', 'MALLA', 'CANTONERA', 'ESQUINERO', 'MANIJON', 'MOLDURA', 'CONTRAMARCO', 'TERMINACION', 'MARCO', 'PLANCHUELA', 'TUBULAR', 'ESCUADRA', 'TACO', 'TUERCA', 'ARANDELA', 'PISTON', 'AMORTIGUADOR', 'BURLETE', 'TAPON', 'ACCESORIO', 'RINCONERO', 'CONTRAVIDRIO', 'ANTEPECHO', 'BATEA', 'PLANA', 'TARUGO'],
};

function categorize(name) {
    if (!name) return 'OTROS';
    const raw = name.toUpperCase().trim();

    // PRIORIDAD 1: PLACAS (Marcas muy específicas)
    if (CATEGORIES.PLACAS.some(k => raw.includes(k))) return 'PLACAS';

    // PRIORIDAD 2: HERRAMIENTAS (Incluyendo el patrón de 7 dígitos)
    if (/^\d{7}\s/.test(raw) || CATEGORIES['HERRAMIENTAS ELECTRICAS'].some(k => raw.includes(k))) return 'HERRAMIENTAS ELECTRICAS';

    // PRIORIDAD 3: QUIMICOS
    if (CATEGORIES.QUIMICOS.some(k => raw.includes(k))) return 'QUIMICOS';

    // PRIORIDAD 4: HERRAJES
    if (CATEGORIES.HERRAJES.some(k => raw.includes(k))) return 'HERRAJES';

    return 'OTROS';
}

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        console.log('--- Iniciando Re-organización Robusta v4 ---');

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'PRECIOS VENTA A.P.!A:E'
        });
        const rows = response.data.values || [];
        if (rows.length === 0) return;

        const dataRows = rows.slice(1);
        const isCode = (val) => /^[A-Z]{3}-\d{4}$/.test(val);

        const products = [];

        dataRows.forEach(row => {
            const colA = (row[0] || "").trim();
            const colB = (row[1] || "").trim();
            const p1 = row[2] || "";
            const p2 = row[3] || "";
            const date = row[4] || "";

            if (!colA && !colB) return;

            // CASO 1: Col A tiene un código válido
            if (isCode(colA)) {
                products.push({ name: colB, p1, p2, date });
            }
            // CASO 2: Col A NO es un código pero tiene texto
            else {
                // Si Col B también tiene texto y NO es un precio (no empieza con $)
                // entonces probablemente hay dos productos en la misma fila por error de pegado
                if (colB && !colB.startsWith('$') && isNaN(colB.replace(/[$,.]/g, ''))) {
                    products.push({ name: colA, p1: "", p2: "", date: "" }); // El producto en A no tiene precios asociados
                    products.push({ name: colB, p1, p2, date }); // El producto en B tiene los precios de la fila
                } else {
                    // Col A es el nombre, y los precios están en B, C, D
                    products.push({ name: colA, p1: colB, p2: p1, date: p2 });
                }
            }
        });

        // Re-categorizar y asignar códigos limpios
        const grouped = { 'PLACAS': [], 'HERRAJES': [], 'QUIMICOS': [], 'HERRAMIENTAS ELECTRICAS': [], 'OTROS': [] };
        const finalMainRows = [];
        const counters = { PLACAS: 1, HERRAJES: 1, QUIMICOS: 1, 'HERRAMIENTAS ELECTRICAS': 1, OTROS: 1 };

        products.forEach(p => {
            if (!p.name || p.name.length < 3) return;
            const cat = categorize(p.name);
            const prefix = cat === 'HERRAMIENTAS ELECTRICAS' ? 'HEE' : cat.substring(0, 3);
            const code = `${prefix}-${String(counters[cat]).padStart(4, '0')}`;
            counters[cat]++;

            finalMainRows.push([code, p.name, p.p1 || "", p.p2 || "", p.date || ""]);
            grouped[cat].push({ code, name: p.name });
        });

        // Escribir cambios
        const updateData = [
            {
                range: 'PRECIOS VENTA A.P.!A1',
                values: [['CODIGO', 'ARTICULO', 'EFECTIVO', 'TRANSFERENCIA', 'ACTUALIZACION'], ...finalMainRows]
            }
        ];

        for (const [catName, items] of Object.entries(grouped)) {
            const catValues = [['CODIGO', 'ARTICULO', 'EFECTIVO', 'TRANSFERENCIA', 'ACTUALIZACION']];
            items.forEach((item, idx) => {
                const rowIdx = idx + 2;
                catValues.push([
                    item.code,
                    item.name,
                    `=VLOOKUP(A${rowIdx}; 'PRECIOS VENTA A.P.'!A:E; 3; FALSE)`,
                    `=VLOOKUP(A${rowIdx}; 'PRECIOS VENTA A.P.'!A:E; 4; FALSE)`,
                    `=VLOOKUP(A${rowIdx}; 'PRECIOS VENTA A.P.'!A:E; 5; FALSE)`
                ]);
            });

            await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: `${catName}!A1:E5000` });
            updateData.push({ range: `${catName}!A1`, values: catValues });
        }

        await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: 'PRECIOS VENTA A.P.!A1:E10000' });
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { valueInputOption: 'USER_ENTERED', data: updateData }
        });

        console.log('✅ Planilla reparada y organizada con éxito.');

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
