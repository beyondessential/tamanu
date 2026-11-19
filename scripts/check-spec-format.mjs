#!/usr/bin/env node
/**
 * Validate that specs under `specs/` follow the spec format in
 * `.agents/docs/spec-format.md`. The format was adopted across every spec in
 * one pass; without a check, a branch cut before that pass silently reintroduces
 * the old style on merge, which is how the table pagination spec arrived in the
 * old format minutes after the conversion landed.
 *
 * Only mechanical, unambiguous markers are checked. Judgement calls — whether a
 * scope sentence carries the right scope, whether a callout states a reason
 * rather than restating its bullet — are left to review.
 *
 * Usage: node scripts/check-spec-format.mjs [file ...]   (defaults to all specs)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

const findSpecs = dir =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findSpecs(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });

// Files under specs/ that are not specs and so are not held to the format.
const NOT_SPECS = new Set([
  // A configuration guide for deployment staff, in the second person, not
  // acceptance criteria. Recorded as needing a move to docs/user-manuals/.
  'specs/invoicing/configuration-guide.md',
]);

const RFC2119 = /\b(MUST NOT|MUST|SHOULD NOT|SHOULD|SHALL NOT|SHALL|REQUIRED|RECOMMENDED)\b/;

// Blank out fenced code blocks and inline code so an example of the old format,
// or a header name that happens to read as a keyword, is not flagged as prose.
const withoutCode = text => {
  let fenced = false;
  return text.split('\n').map(line => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return '';
    }
    return fenced ? '' : line.replace(/`[^`]*`/g, '``');
  });
};

const checkFile = file => {
  const fromRoot = relative(ROOT, resolve(file));
  // A file outside the repo (a scratch copy under test) keeps its own path.
  const rel = fromRoot.startsWith('..') ? file : fromRoot;
  if (NOT_SPECS.has(rel)) return [];

  const raw = readFileSync(file, 'utf8');
  const lines = withoutCode(raw);
  const problems = [];
  const at = (line, message) => problems.push({ file: rel, line, message });

  // Criteria are plain bullets, never checkboxes.
  lines.forEach((line, i) => {
    if (/^\s*- \[[ xX]\] /.test(line)) {
      at(i + 1, 'Checkbox criterion. Criteria are plain bullets (`- `), not `- [ ]`.');
    }
  });

  // Requirement strength is not marked with RFC 2119 keywords.
  lines.forEach((line, i) => {
    const match = line.match(RFC2119);
    if (match) {
      at(i + 1, `RFC 2119 keyword "${match[1]}". The format uses the declarative voice instead.`);
    }
  });

  // Cross-references are woven into the criterion as inline links.
  lines.forEach((line, i) => {
    const match = line.match(/\(see [^)]*(?:\.md|\/)[^)]*\)/);
    if (match) {
      at(
        i + 1,
        `Trailing cross-reference "${match[0]}". Weave it into the criterion as an inline link.`,
      );
    }
  });

  // A callout is one source line per paragraph, never hard-wrapped.
  let inCallout = false;
  lines.forEach((line, i) => {
    if (/^>\s*\[!\w+\]/.test(line)) {
      inCallout = true;
      return;
    }
    if (!inCallout) return;
    if (!line.startsWith('>')) {
      inCallout = false;
      return;
    }
    if (/^>\s*\S/.test(line) && /^>\s*\S/.test(lines[i + 1] ?? '')) {
      at(i + 1, 'Hard-wrapped callout. Use one source line per paragraph.');
    }
  });

  // Every spec carries a short stable id for code-to-spec traceability.
  if (!/^---\n(?:.*\n)*?id:\s*\S+/m.test(raw)) {
    at(1, 'No `id:` in frontmatter. Every spec needs a short stable id, e.g. `id: ALG`.');
  }

  return problems;
};

const args = process.argv.slice(2);
const files = (args.length ? args.map(f => resolve(f)) : findSpecs(join(ROOT, 'specs'))).filter(
  f => existsSync(f) && f.endsWith('.md'),
);

const problems = files.flatMap(checkFile);

if (!problems.length) {
  console.log(`OK: ${files.length} spec file(s) match the spec format.`);
} else {
  for (const p of problems) {
    // GitHub Actions renders this inline on the pull request diff.
    console.log(`::error file=${p.file},line=${p.line}::${p.message}`);
    console.log(`${p.file}:${p.line}  ${p.message}`);
  }
  console.log(`\n${problems.length} spec format problem(s). See .agents/docs/spec-format.md.`);
  process.exitCode = 1;
}
