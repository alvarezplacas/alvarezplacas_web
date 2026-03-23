import fs from 'fs';

const CSV_PATH = './database/catalogo.csv';
const content = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = content.split(/\r?\n/);
const headers = lines[0].split(';').map(h => h.trim());
console.log("Headers:", JSON.stringify(headers));

for (let i = 1; i < 3; i++) {
    const values = lines[i].split(';');
    console.log(`Line ${i} parts (${values.length}):`, JSON.stringify(values));
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx]; });
    console.log(`Row ${i} object:`, JSON.stringify(row));
}
