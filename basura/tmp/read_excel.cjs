const xlsx = require('xlsx');
const workbook = xlsx.readFile('d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/_basura/data/biblioteca/Placas.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
console.log(JSON.stringify(data.slice(0, 20), null, 2));
