import xlsx from 'xlsx';
import path from 'path';

const excelPath = 'd:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/_infra_docs/LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';

try {
    const workbook = xlsx.readFile(excelPath);
    console.log('Sheets found:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        if (data.length > 0) {
            console.log(`\nSheet: ${sheetName}`);
            console.log('Columns (Header):', data[0]);
            console.log('Sample Row:', data[1]);
        }
    });
} catch (err) {
    console.error('Error reading excel:', err.message);
}
