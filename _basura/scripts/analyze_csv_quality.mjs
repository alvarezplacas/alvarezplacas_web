import fs from 'fs';

const CSV_PATH = './database/catalogo.csv';
const content = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
const headers = lines[0].split(';').map(h => h.trim());

let hasMarca = 0;
let emptyMarca = 0;

for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    const marca = values[5] ? values[5].trim() : '';
    if (marca) {
        hasMarca++;
    } else {
        emptyMarca++;
    }
}

console.log(`Total rows (excluding header): ${lines.length - 1}`);
console.log(`Rows with Marca: ${hasMarca}`);
console.log(`Rows with empty Marca: ${emptyMarca}`);
