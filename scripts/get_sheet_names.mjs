import xlsx from 'xlsx';
const EXCEL_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\src\\data\\biblioteca\\Placas.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
console.log(workbook.SheetNames);
