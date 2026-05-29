import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[PAGE CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.error(`[PAGE ERROR]`, err);
  });
  
  console.log('Navigating to https://alvarezplacas.com.ar/catalogo ...');
  await page.goto('https://alvarezplacas.com.ar/catalogo', { waitUntil: 'networkidle2' });
  
  console.log('Wait 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Checking visible elements...');
  const numCards = await page.$$eval('.catalog-item', els => els.length);
  const numVisibleCards = await page.$$eval('.catalog-item', els => els.filter(e => e.style.display !== 'none').length);
  
  console.log(`Total cards: ${numCards}, Visible cards: ${numVisibleCards}`);
  
  await browser.close();
  console.log('Done.');
})();
