import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const webAppDir = path.join(repoRoot, 'packages', 'web', 'app');

/**
 * Recursively collect file paths under a directory matching given extensions.
 */
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

function removeColorsFromConstantsImport(source) {
  // Handle multi-line named imports from constants or constants/index
  const importRegex = /import\s*\{([\s\S]*?)\}\s*from\s*(["'][^"']*constants(?:\/index)?["'])\s*;?/g;
  let didChange = false;
  const updated = source.replace(importRegex, (match, inside, fromPath) => {
    // Split specifiers by comma, trim whitespace/newlines
    const specifiers = inside
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const filtered = specifiers.filter(s => s !== 'Colors');
    if (filtered.length === specifiers.length) {
      return match; // nothing to change in this import
    }
    didChange = true;
    if (filtered.length === 0) {
      return ''; // remove the whole import line if no specifiers left
    }
    return `import { ${filtered.join(', ')} } from ${fromPath};`;
  });
  return { updated, didChange };
}

function ensureTAManuColorsImport(source) {
  if (/\bTAMANU_COLORS\b/.test(source)) {
    // If there's already an import bringing TAMANU_COLORS from @tamanu/ui-components, leave it
    const alreadyImported = /import\s*\{[^}]*\bTAMANU_COLORS\b[^}]*\}\s*from\s*["']@tamanu\/ui-components["']/.test(source);
    const hasAnyUiImport = /from\s*["']@tamanu\/ui-components["']/.test(source);
    if (alreadyImported) return source;
    if (hasAnyUiImport) {
      // Append TAMANU_COLORS to existing named import(s) from @tamanu/ui-components
      return source.replace(
        /import\s*\{([^}]*)\}\s*from\s*["']@tamanu\/ui-components["']/,
        (m, inside) => {
          const names = inside
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          if (!names.includes('TAMANU_COLORS')) names.push('TAMANU_COLORS');
          return `import { ${names.join(', ')} } from '@tamanu/ui-components'`;
        },
      );
    }
    // Otherwise, add a new import at the top
    return `import { TAMANU_COLORS } from '@tamanu/ui-components';\n` + source;
  }
  return source;
}

function replaceColorsUsages(source) {
  // Replace Colors.property or Colors['prop'] usages with TAMANU_COLORS
  return source.replace(/\bColors\b(?=(\.|\[))/g, 'TAMANU_COLORS');
}

function processStylesConstants(filePath, content) {
  // Special handling for constants/styles.js
  let changed = false;
  // Normalize import of TAMANU_COLORS without alias
  const newFirstImport = `import { TAMANU_COLORS } from '@tamanu/ui-components';`;
  const lines = content.split(/\r?\n/);
  if (/^import\s+\{\s*TAMANU_COLORS\s+as\s+Colors\s*\}\s+from\s+['"]@tamanu\/ui-components['"];?/.test(lines[0])) {
    lines[0] = newFirstImport;
    changed = true;
  }
  // Update export to expose TAMANU_COLORS instead of Colors
  const exportIdx = lines.findIndex(l => /export\s*\{[^}]*Colors[^}]*\}/.test(l));
  if (exportIdx !== -1) {
    lines[exportIdx] = lines[exportIdx].replace(/\{([^}]*)\}/, (m, inside) => {
      const names = inside
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(n => (n === 'Colors' ? 'TAMANU_COLORS' : n));
      return `{ ${names.join(', ')} }`;
    });
    changed = true;
  }
  // Ensure usages are TAMANU_COLORS
  const joined = lines.join('\n');
  const replaced = replaceColorsUsages(joined);
  if (replaced !== joined) changed = true;
  return { updated: replaced, changed };
}

const files = collectFiles(webAppDir, ['.js', '.jsx']);
let modifiedCount = 0;
let processedCount = 0;
const changedFiles = [];

for (const file of files) {
  processedCount += 1;
  let content = fs.readFileSync(file, 'utf8');

  // Only process files that import Colors from constants, or the styles constants file
  const importsColorsFromConstants = /import[\s\S]*\{[\s\S]*\bColors\b[\s\S]*\}[\s\S]*from[\s\S]*['"][^'"]*constants(?:\/index)?['"]/m.test(content);
  const isStyles = file.endsWith(path.join('constants', 'styles.js'));
  if (!importsColorsFromConstants && !isStyles) {
    continue;
  }

  let original = content;
  if (isStyles) {
    const { updated, changed } = processStylesConstants(file, content);
    content = updated;
    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedCount += 1;
      changedFiles.push(path.relative(repoRoot, file));
    }
    continue;
  }

  // 1) Remove Colors from constants import(s)
  const removed = removeColorsFromConstantsImport(content);
  content = removed.updated;

  // 2) Replace Colors usages with TAMANU_COLORS
  const replaced = replaceColorsUsages(content);
  content = replaced;

  // 3) Ensure TAMANU_COLORS import exists
  content = ensureTAManuColorsImport(content);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount += 1;
    changedFiles.push(path.relative(repoRoot, file));
  }
}

console.log(JSON.stringify({ processedCount, modifiedCount, changedFiles }, null, 2));


