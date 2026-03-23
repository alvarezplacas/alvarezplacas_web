import xlsx from 'xlsx';
const EXCEL_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\_infra_docs\\LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets['PRECIOS VENTA A.P.'];
const allData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log(allData[66]); // Row 67 (0-indexed base + offset)
// Actually rows started at 6 in my ingest script (slice(6))
// So row 60 in log is row 60 + 6 - 3 = ?
// Wait, row 3 in log is `allData[6]`.
// So row 60 in log is `allData[6+60-3]`? No.
// Let's just find the row that says "SADEPAN TEXTURADOS"
const row = allData.find(r => JSON.stringify(r).includes('SADEPAN TEXTURADOS'));
console.log(row);
