import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

const aliases = {
  '@lib': path.join(srcDir, 'lib'),
  '@layouts': path.join(srcDir, 'layouts'),
  '@components': path.join(srcDir, 'components'),
  '@features': path.join(srcDir, 'features'),
  '@domain': path.join(srcDir, 'domain'),
  '@infrastructure': path.join(srcDir, 'infrastructure'),
  '@data': path.join(srcDir, 'data'),
  '@styles': path.join(srcDir, 'styles')
};

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    let absolutePath = '';

    if (importPath.startsWith('.')) {
      absolutePath = path.resolve(path.dirname(filePath), importPath);
    } else {
      for (const [alias, aliasPath] of Object.entries(aliases)) {
        if (importPath.startsWith(alias)) {
          absolutePath = importPath.replace(alias, aliasPath);
          break;
        }
      }
    }

    if (absolutePath && !absolutePath.includes('node_modules')) {
      // Try with common extensions if not present
      const extensions = ['', '.js', '.astro', '.ts', '.css', '.json'];
      let found = false;
      let actualCase = '';

      for (const ext of extensions) {
        const p = absolutePath + ext;
        if (fs.existsSync(p)) {
          found = true;
          // Check casing
          const dir = path.dirname(p);
          const base = path.basename(p);
          const files = fs.readdirSync(dir);
          if (!files.includes(base)) {
            console.log(`CASE MISMATCH in ${filePath}:`);
            console.log(`  Imported: ${importPath}`);
            console.log(`  File on disk: ${files.find(f => f.toLowerCase() === base.toLowerCase())}`);
          }
          break;
        }
      }

      if (!found && !importPath.includes('astro:') && !importPath.includes('@') ) {
         // Skip packages for now, only check relative/alias if they look like internal files
         if (importPath.startsWith('.') || Object.keys(aliases).some(a => importPath.startsWith(a))) {
            console.log(`NOT FOUND in ${filePath}: ${importPath}`);
         }
      }
    }
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(astro|js|ts)$/.test(file)) {
      checkFile(fullPath);
    }
  }
}

walk(srcDir);
console.log('Audit complete.');
