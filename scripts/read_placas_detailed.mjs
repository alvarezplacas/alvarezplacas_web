import xlsx from 'xlsx';
const EXCEL_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\src\\data\\biblioteca\\Placas.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
console.log('Sheets:', workbook.SheetNames);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const allData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log('First 10 rows:', allData.slice(0, 10));
