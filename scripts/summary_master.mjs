import fs from 'fs';
const JSON_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\src\\data\\biblioteca\\master_catalog.json';
const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const withImages = data.filter(item => item.imagen);
console.log('Total items:', data.length);
console.log('Items with images:', withImages.length);
const brands = [...new Set(data.map(item => item.brand))];
console.log('Brands:', brands);
