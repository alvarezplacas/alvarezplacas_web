import fs from 'fs';
const JSON_PATH = 'd:\\Alvarezplacas_2026\\WEB-alvarezplacas_astro\\Alvarezplacas\\src\\data\\biblioteca\\master_catalog.json';
const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const brandStats = {};
data.forEach(item => {
  const b = item.brand || 'Unknown';
  if (!brandStats[b]) brandStats[b] = { total: 0, withImage: 0 };
  brandStats[b].total++;
  if (item.imagen) brandStats[b].withImage++;
});
console.log(JSON.stringify(brandStats, null, 2));
