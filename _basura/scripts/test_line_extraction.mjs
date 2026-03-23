function extractLine(articulo) {
    const s = articulo.toUpperCase();
    let brand = '';
    if (s.includes('EGGER')) brand = 'EGGER';
    else if (s.includes('FAPLAC')) brand = 'FAPLAC';
    else if (s.includes('SADEPAN')) brand = 'SADEPAN';
    else return 'General';

    // Rule 1: Quotes
    const quoteMatch = s.match(/"(.*?)"/);
    if (quoteMatch) return quoteMatch[1];

    // Rule 2: Text between Brand and Dimension/spec
    const parts = s.split(brand)[1].trim().split(' ');
    const lineParts = [];
    for (const p of parts) {
        if (p.includes('MM') || p === 'AGLO' || p === 'MDF' || p === 'A/' || p === 'M/') break;
        lineParts.push(p);
    }
    let res = lineParts.length > 0 ? lineParts.join(' ') : 'General';
    if (res === 'BLANCO') return 'General'; // BLANCO is usually a base, not a line
    return res;
}

const tests = [
    'BLANCO EGGER 18MM MDF',
    'EGGER "GRUPO 2" 18MM AGLO',
    'SADEPAN TEXTURADOS 18MM AGLO',
    'FAPLAC MADERA CLASICA 18MM AGLO',
    'SADEPAN MADERA CLASICOS 18MM AGLO',
    'FAPLAC UNI NEUTRO 18MM MDF',
    'FAPLAC BLANCO PREMIUM 18MM AGLO'
];

tests.forEach(t => console.log(`"${t}" -> [${extractLine(t)}]`));
