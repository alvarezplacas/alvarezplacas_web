import xlsx from 'xlsx';
import path from 'path';

const excelPath = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\_infra_docs\\LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';

async function inspect() {
  const workbook = xlsx.readFile(excelPath);
  const sheetName = 'PRECIOS VENTA A.P.';
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Scan entries in ${sheetName}:`);
  for (let i = 0; i < 20; i++) {
    if (data[i]) {
      console.log(`Row ${i}:`, data[i]);
    }
  }
}

inspect().catch(console.error);
