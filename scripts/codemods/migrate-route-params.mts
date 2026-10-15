/**
 * Codemod: migrate interpolated API endpoint paths to `route()` descriptors.
 *
 *   api.get(`patient/${patientId}/allergies`, query)
 *     ->
 *   api.get(route('patient/:patientId/allergies', { patientId }), query)
 *
 * Rewrites `api.<verb>(...)` call sites in packages/web and packages/patient-portal
 * whose first argument is a template literal with interpolations, and adds the
 * `route` import. Call sites where a param name or segment can't be derived
 * unambiguously are left untouched and reported for manual review.
 *
 * Usage (from repo root):
 *   tsx scripts/codemods/migrate-route-params.mts [--write] [globs...]
 *
 * Without --write it is a dry run: it prints what it would change and what it
 * flagged, and saves nothing.
 */
import {
  Node,
  Project,
  QuoteKind,
  SyntaxKind,
  type CallExpression,
  type SourceFile,
  type TemplateExpression,
} from 'ts-morph';

const VERBS = new Set(['get', 'post', 'put', 'patch', 'delete', 'download']);
const DEFAULT_GLOBS = [
  'packages/web/app/**/*.{js,jsx,ts,tsx}',
  'packages/patient-portal/src/**/*.{js,jsx,ts,tsx}',
];

const args = process.argv.slice(2);
const write = args.includes('--write');
const globs = args.filter(a => !a.startsWith('--'));

interface Flag {
  file: string;
  line: number;
  code: string;
  reason: string;
}

const flags: Flag[] = [];
let rewrittenCalls = 0;
const touchedFiles = new Set<string>();

// Is this call `<something ending in>.api.<verb>(...)` / `api.<verb>(...)`?
function isApiVerbCall(call: CallExpression): string | null {
  const callee = call.getExpression();
  if (!Node.isPropertyAccessExpression(callee)) return null;
  const verb = callee.getName();
  if (!VERBS.has(verb)) return null;
  const objectText = callee.getExpression().getText();
  if (!/(^|\.)api$/.test(objectText)) return null;
  return verb;
}

// Derive a param name from an interpolated expression. Unwraps encodeURIComponent().
// Returns null when the name can't be derived unambiguously.
function deriveParamName(expr: Node): { name: string; valueText: string } | null {
  let value = expr;
  if (Node.isCallExpression(value)) {
    const fn = value.getExpression().getText();
    if (fn === 'encodeURIComponent' && value.getArguments().length === 1) {
      value = value.getArguments()[0];
    } else {
      return null; // some other call — can't name it
    }
  }

  if (Node.isIdentifier(value)) {
    return { name: value.getText(), valueText: value.getText() };
  }
  if (Node.isPropertyAccessExpression(value)) {
    const property = value.getName();
    const object = value.getExpression();
    // A bare `.id` carries no meaning on its own, so name it after what it
    // identifies: patient.id -> patientId, selectedDispense.id -> selectedDispenseId.
    // Other properties keep their own name: note.recordId -> recordId.
    const name =
      property === 'id' && Node.isIdentifier(object) ? `${object.getText()}Id` : property;
    return { name, valueText: value.getText() };
  }
  return null;
}

function migrateCall(call: CallExpression, sourceFile: SourceFile): void {
  const verb = isApiVerbCall(call);
  if (!verb) return;

  const firstArg = call.getArguments()[0];
  if (!firstArg || !Node.isTemplateExpression(firstArg)) return;

  const template = firstArg as TemplateExpression;
  const callCode = call.getText().split('\n')[0].slice(0, 120);
  const line = call.getStartLineNumber();
  const flag = (reason: string) =>
    flags.push({ file: sourceFile.getFilePath(), line, code: callCode, reason });

  // Reconstruct the literal text segments and interpolations in order.
  const head = template.getHead().getLiteralText();
  const spans = template.getTemplateSpans();

  if (head.includes('?') || spans.some(s => s.getLiteral().getLiteralText().includes('?'))) {
    flag('template contains a query string — move those params to the query argument');
    return;
  }

  let pattern = head;
  const params: Array<{ name: string; valueText: string }> = [];
  const seen = new Set<string>();

  for (const span of spans) {
    const derived = deriveParamName(span.getExpression());
    const literalAfter = span.getLiteral().getLiteralText();
    if (!derived) {
      flag(`cannot derive a param name from \${${span.getExpression().getText()}}`);
      return;
    }

    // The interpolation must occupy a whole path segment: bounded by '/' (or
    // start/end of the path) on both sides.
    const beforeOk = pattern === '' || pattern.endsWith('/');
    const afterOk = literalAfter === '' || literalAfter.startsWith('/');
    if (!beforeOk || !afterOk) {
      flag(`\${${derived.valueText}} is not a whole path segment (partial interpolation)`);
      return;
    }

    if (seen.has(derived.name)) {
      flag(`duplicate derived param name ":${derived.name}"`);
      return;
    }
    seen.add(derived.name);

    params.push(derived);
    pattern += `:${derived.name}${literalAfter}`;
  }

  const paramsText = params
    .map(p => (p.name === p.valueText ? p.name : `${p.name}: ${p.valueText}`))
    .join(', ');

  firstArg.replaceWithText(`route('${pattern}', { ${paramsText} })`);
  ensureRouteImport(sourceFile);
  rewrittenCalls += 1;
  touchedFiles.add(sourceFile.getFilePath());
}

function ensureRouteImport(sourceFile: SourceFile): void {
  const existing = sourceFile.getImportDeclaration(
    d => d.getModuleSpecifierValue() === '@tamanu/api-client',
  );
  if (existing) {
    const already = existing.getNamedImports().some(n => n.getName() === 'route');
    if (!already) existing.addNamedImport('route');
    return;
  }
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@tamanu/api-client',
    namedImports: ['route'],
  });
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { allowJs: true },
  manipulationSettings: { quoteKind: QuoteKind.Single },
});
project.addSourceFilesAtPaths(globs.length ? globs : DEFAULT_GLOBS);

const sourceFiles = project.getSourceFiles();
console.log(`Scanning ${sourceFiles.length} files...`);

for (const sourceFile of sourceFiles) {
  // Collect targets up front: rewriting a call's first argument forgets its
  // descendant nodes (e.g. an inner encodeURIComponent call), so we must not
  // still be iterating them afterwards.
  const targets = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => {
      if (!isApiVerbCall(call)) return false;
      const firstArg = call.getArguments()[0];
      return Boolean(firstArg && Node.isTemplateExpression(firstArg));
    });

  for (const call of targets) {
    const line = call.getStartLineNumber();
    const code = call.getText().split('\n')[0].slice(0, 120);
    try {
      migrateCall(call, sourceFile);
    } catch (err) {
      flags.push({
        file: sourceFile.getFilePath(),
        line,
        code,
        reason: `codemod error: ${(err as Error).message}`,
      });
    }
  }
}

if (write) {
  project.saveSync();
  console.log(`\nWrote ${rewrittenCalls} rewrites across ${touchedFiles.size} files.`);
} else {
  console.log(`\nDry run: would rewrite ${rewrittenCalls} calls across ${touchedFiles.size} files.`);
  console.log('Pass --write to apply.');
}

if (flags.length) {
  console.log(`\nFlagged for manual review (${flags.length}):`);
  for (const f of flags) {
    console.log(`  ${f.file}:${f.line}\n    ${f.code}\n    -> ${f.reason}`);
  }
}
