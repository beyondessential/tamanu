import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const webAppDir = path.join(repoRoot, 'packages', 'web', 'app');

const TRANSLATION_SYMBOLS = [
  'TranslatedText',
  'TranslatedReferenceData',
  'TranslatedEnum',
  'TranslatedSex',
  'isTranslatedText',
  'extractTranslationFromComponent',
  'getTranslatedOptions',
  'TranslatedSelectField',
  'TranslatedMultiSelectField',
  'TranslatedEnumField',
  'DebugTooltip',
  'TranslatedOption',
  'TranslatedOptionSelectField',
];

function collectFiles(dir, exts, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, exts, results);
    } else if (exts.includes(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function rewriteTranslationImports(source) {
  let changed = false;
  // 1) Named imports from components/Translation (barrel) to @tamanu/ui-components
  source = source.replace(
    /import\s*\{([^}]*)\}\s*from\s*(["'][^"']*components\/Translation[^"]*["'])\s*;?/g,
    (m, inside) => {
      const names = inside
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => TRANSLATION_SYMBOLS.includes(s));
      if (names.length === 0) return m;
      changed = true;
      return `import { ${names.join(', ')} } from '@tamanu/ui-components';`;
    },
  );

  // 2) Default or named imports of specific files under components/Translation/* to named from ui-components
  // e.g. import { TranslatedText } from '../../components/Translation/TranslatedText'
  source = source.replace(
    /import\s*\{\s*([A-Za-z0-9_,\s]+)\s*\}\s*from\s*(["'][^"']*components\/Translation\/[A-Za-z0-9_/.-]+["'])\s*;?/g,
    (m, names) => {
      const list = names
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => TRANSLATION_SYMBOLS.includes(s));
      if (list.length === 0) return m;
      changed = true;
      return `import { ${list.join(', ')} } from '@tamanu/ui-components';`;
    },
  );

  // 3) Merge with existing ui-components imports if present
  if (changed) {
    const uiImportRegex = /import\s*\{([^}]*)\}\s*from\s*["']@tamanu\/ui-components["']/;
    const matches = uiImportRegex.exec(source);
    if (matches) {
      const current = matches[1]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      // Remove duplicate ui-components import lines if multiple created
      const allNew = [];
      source = source.replace(/import\s*\{([^}]*)\}\s*from\s*["']@tamanu\/ui-components["'];?/g, (m2, inner) => {
        inner
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(s => allNew.push(s));
        return '';
      });
      const merged = Array.from(new Set([...current, ...allNew]));
      source = `import { ${merged.join(', ')} } from '@tamanu/ui-components';\n` + source;
    }
  }
  return { source, changed };
}

const files = collectFiles(webAppDir, ['.js', '.jsx']);
let modifiedCount = 0;
let processedCount = 0;
const changedFiles = [];

for (const file of files) {
  processedCount += 1;
  let content = fs.readFileSync(file, 'utf8');
  if (!/components\/Translation\//.test(content) && !/components\/Translation["']/.test(content)) {
    continue;
  }
  const original = content;
  const { source, changed } = rewriteTranslationImports(content);
  if (changed && source !== original) {
    fs.writeFileSync(file, source, 'utf8');
    modifiedCount += 1;
    changedFiles.push(path.relative(repoRoot, file));
  }
}

console.log(JSON.stringify({ processedCount, modifiedCount, changedFiles }, null, 2));


