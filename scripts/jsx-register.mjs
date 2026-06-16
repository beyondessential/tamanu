/**
 * Node module customization hook that transforms .jsx/.tsx (and .ts/.js with JSX)
 * on the fly with esbuild, so build-less packages containing JSX (the react-pdf
 * templates in @tamanu/shared and the server PDF entry points) run under native Node.
 *
 * Plain .ts is handled by Node's built-in type stripping; plain .js runs natively.
 * Only JSX needs this hook, because JSX is not valid JS/TS syntax that Node can run.
 *
 * Usage: node --import ./scripts/jsx-register.mjs <entry>
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

export async function load(url, context, nextLoad) {
  if (/\.(jsx|tsx)$/.test(url)) {
    const source = await readFile(fileURLToPath(url), 'utf8');
    const { code } = await transform(source, {
      loader: url.endsWith('.tsx') ? 'tsx' : 'jsx',
      format: 'esm',
      jsx: 'automatic',
      jsxImportSource: 'react',
      sourcefile: fileURLToPath(url),
      sourcemap: 'inline',
    });
    return { format: 'module', source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
