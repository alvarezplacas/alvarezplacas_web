const xlsx = require('xlsx');
const path = require('path');
const workbook = xlsx.readFile('d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/_basura/data/biblioteca/Placas.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data.slice(0, 5), null, 2));
