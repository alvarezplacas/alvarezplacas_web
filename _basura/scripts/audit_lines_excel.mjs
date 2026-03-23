import xlsx from 'xlsx';
const EXCEL_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\_infra_docs\\LISTAS DE PRECIOS - ALVAREZ PLACAS - PARA VENTAS.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Unique Sadepan/Faplac Prefixes:');
const lines = new Set();
data.forEach(row => {
    const s = String(row[0] || '').toUpperCase();
    if (s.includes('SADEPAN') || s.includes('FAPLAC')) {
        const parts = s.split(' ');
        if (parts.length > 1) {
            // Take up to 3 words after brand
            const brandIdx = parts.indexOf('SADEPAN') !== -1 ? parts.indexOf('SADEPAN') : parts.indexOf('FAPLAC');
            const lineCandidate = parts.slice(brandIdx + 1, brandIdx + 3).join(' ');
            lines.add(lineCandidate);
        }
    }
});
console.log(Array.from(lines));
