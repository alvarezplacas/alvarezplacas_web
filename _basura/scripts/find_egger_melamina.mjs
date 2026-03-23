import xlsx from 'xlsx';
const EXCEL_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\_infra_docs\\LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Searching for "MELAMINA" or "MDF" for EGGER...');
data.forEach((row, index) => {
    const rowStr = JSON.stringify(row);
    if (rowStr.includes('EGGER')) {
        if (rowStr.includes('MELAMINA') || rowStr.includes('MDF')) {
            console.log(`Row ${index}:`, row);
        }
    }
});
