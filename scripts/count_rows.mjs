import xlsx from 'xlsx';
const EXCEL_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\_infra_docs\\LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets['PRECIOS VENTA A.P.'];
const allData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log('Total rows:', allData.length);
