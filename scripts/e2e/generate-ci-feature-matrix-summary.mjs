import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[i + 1]?.startsWith('--') ? true : argv[i + 1];
    args[key] = value;
    if (value !== true) i += 1;
  }
  return args;
}

function walkFiles(dir, predicate) {
  if (!existsSync(dir)) return [];
  const files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const path = resolve(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...walkFiles(path, predicate));
    } else if (predicate(path)) {
      files.push(path);
    }
  }
  return files;
}

function parseFeatureMatrixRows(markdown) {
  const rows = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    if (!line.startsWith('| ')) continue;
    if (line.includes('| --- |')) continue;
    const cols = line.split('|').map(part => part.trim()).filter(Boolean);
    if (cols.length !== 5) continue;
    if (cols[0] === 'Feature area') continue;

    const specs = [...cols[2].matchAll(/`([^`]+\.spec\.ts)`/g)].map(match => match[1]);
    rows.push({
      featureArea: cols[0],
      journeyCovered: cols[1],
      primarySpecs: specs,
      coverageDepth: cols[3],
      notes: cols[4],
    });
  }
  return rows;
}

function getSpecPathFromLocation(location) {
  if (!location?.file) return null;
  const normalized = location.file.replaceAll('\\', '/');
  const marker = 'tests/';
  const idx = normalized.lastIndexOf(marker);
  if (idx === -1) return null;
  return normalized.slice(idx);
}

function collectPlaywrightResults(rootSuites, failedTests, seenSpecs) {
  const suites = Array.isArray(rootSuites) ? rootSuites : [];
  for (const suite of suites) {
    const specPath = getSpecPathFromLocation(suite.location);
    if (specPath) seenSpecs.add(specPath);

    const specs = Array.isArray(suite.specs) ? suite.specs : [];
    for (const spec of specs) {
      const tests = Array.isArray(spec.tests) ? spec.tests : [];
      for (const test of tests) {
        const outcomes = Array.isArray(test.results) ? test.results : [];
        const hasFailure = outcomes.some(
          result => result.status === 'failed' || result.status === 'timedOut',
        );
        if (!hasFailure) continue;
        const titlePath = [...(test.titlePath || []), test.title].filter(Boolean).join(' > ');
        failedTests.push({
          specPath: specPath || 'unknown-spec',
          title: titlePath || test.title || 'Untitled test',
        });
      }
    }

    collectPlaywrightResults(suite.suites, failedTests, seenSpecs);
  }
}

function loadPlaywrightFailures(jsonDir) {
  const jsonFiles = walkFiles(jsonDir, path => path.endsWith('.json'));
  const failedTests = [];
  const seenSpecs = new Set();

  for (const file of jsonFiles) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    collectPlaywrightResults(parsed.suites, failedTests, seenSpecs);
  }

  return { failedTests, seenSpecs };
}

function buildSummaryMarkdown(rows, failedTests, seenSpecs) {
  const failedBySpec = new Map();
  for (const test of failedTests) {
    if (!failedBySpec.has(test.specPath)) failedBySpec.set(test.specPath, []);
    failedBySpec.get(test.specPath).push(test.title);
  }

  const tableRows = rows.map(row => {
    const specs = row.primarySpecs;
    if (!specs.length) {
      return `| ${row.featureArea} | ⚪ no spec links | - |`;
    }
    const failedSpecs = specs.filter(spec => failedBySpec.has(spec));
    if (failedSpecs.length) {
      return `| ${row.featureArea} | ❌ failing | ${failedSpecs.map(spec => `\`${spec}\``).join(', ')} |`;
    }
    const wasRun = specs.some(spec => seenSpecs.has(spec));
    if (wasRun) {
      return `| ${row.featureArea} | ✅ passing | - |`;
    }
    return `| ${row.featureArea} | ⚪ not run in shard set | - |`;
  });

  const failingTestsSection = failedTests.length
    ? failedTests
        .slice(0, 30)
        .map(test => `- \`${test.specPath}\`: ${test.title}`)
        .join('\n')
    : '- No failing Playwright tests in this run.';

  return [
    '## E2E Feature Matrix (CI)',
    '',
    '| Feature area | Status | Failing spec(s) |',
    '| --- | --- | --- |',
    ...tableRows,
    '',
    `### Failing tests (${failedTests.length})`,
    '',
    failingTestsSection,
    '',
    '_Source: `docs/testing/e2e-feature-matrix.md` + Playwright JSON report artifacts_',
    '',
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const matrixPath = resolve(args.matrix || 'docs/testing/e2e-feature-matrix.md');
  const reportDir = resolve(args['playwright-json-dir'] || '.artifacts/playwright-json');
  const outputPath = resolve(args.output || '.artifacts/e2e-feature-matrix-summary.md');

  const matrixRaw = readFileSync(matrixPath, 'utf8');
  const rows = parseFeatureMatrixRows(matrixRaw);
  const { failedTests, seenSpecs } = loadPlaywrightFailures(reportDir);
  const markdown = buildSummaryMarkdown(rows, failedTests, seenSpecs);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');
}

main();
