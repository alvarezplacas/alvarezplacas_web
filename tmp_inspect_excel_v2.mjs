import xlsx from 'xlsx';
import path from 'path';

const excelPath = 'd:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/_infra_docs/LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';

try {
    const workbook = xlsx.readFile(excelPath);
    console.log('Sheets found:', workbook.SheetNames);
    
    const sheetName = 'PRECIOS VENTA A.P.';
    const sheet = workbook.Sheets[sheetName];
    
    // Read the first 20 rows as a raw 2D array to see where it actually starts
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0 });
    
    console.log('\n--- FIRST 20 ROWS RAW ---');
    rawData.slice(0, 20).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });

} catch (err) {
    console.log('Error reading excel:', err.message);
}
