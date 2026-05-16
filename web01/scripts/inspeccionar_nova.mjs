import * as xlsx from 'xlsx';
import fs from 'fs';

const EXCEL_FILE = './database/Catalogo_de_productos.xlsx';

function inspect() {
    console.log("--- 🔍 Inspeccionando Hoja NOVA ---");
    if (!fs.existsSync(EXCEL_FILE)) return console.log("Archivo no encontrado");

    const buffer = fs.readFileSync(EXCEL_FILE);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['NOVA'];

    if (!sheet) return console.log("Hoja NOVA no encontrada");

    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log("Primeras 10 filas de NOVA:");
    rows.slice(0, 10).forEach((row, i) => {
        console.log(`Fila ${i + 1}:`, JSON.stringify(row));
    });
}

inspect();
