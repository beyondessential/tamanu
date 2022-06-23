import { promises as fs } from 'fs';
import { join } from 'path';

async function readCoverage(workspace) {
  try {
    const file = await fs.readFile(
      `./packages/${workspace}/coverage/coverage-summary.json`,
      'utf8',
    );
    return { workspace, cov: JSON.parse(file) };
  } catch (e) {
    return null;
  }
}

function pct({ covered, total }) {
  if (total === 0) return 0;
  return Math.round((100 * covered) / total);
}

function addToOverall(overall, { lines, statements, branches, functions }) {
  overall.lines.total += lines.total;
  overall.lines.covered += lines.covered;
  overall.statements.total += statements.total;
  overall.statements.covered += statements.covered;
  overall.branches.total += branches.total;
  overall.branches.covered += branches.covered;
  overall.functions.total += functions.total;
  overall.functions.covered += functions.covered;
}

function workspaceSummary(workspace, { lines, statements, branches, functions }) {
  return [
    '',
    workspace,
    `${pct(statements)}% (${statements.covered}/${statements.total})`,
    `${pct(branches)}% (${branches.covered}/${branches.total})`,
    `${pct(functions)}% (${functions.covered}/${functions.total})`,
    `${pct(lines)}% (${lines.covered}/${lines.total})`,
    '',
  ]
    .join(' | ')
    .trim();
}

function workspaceHeader(workspace, count) {
  return `
<details>
<summary>${count} files in ${workspace}</summary>

| File | Statements | Branches | Functions | Lines |
|:-----|:----------:|:--------:|:---------:|:-----:|
  `.trim();
}

function fileCoverageRow(file, { lines, statements, branches, functions }) {
  return [
    '',
    file,
    `${pct(statements)}% (${statements.covered}/${statements.total})`,
    `${pct(branches)}% (${branches.covered}/${branches.total})`,
    `${pct(functions)}% (${functions.covered}/${functions.total})`,
    `${pct(lines)}% (${lines.covered}/${lines.total})`,
    '',
  ]
    .join(' | ')
    .trim();
}

function overallSummaryRow({ lines, statements, branches, functions }) {
  return [
    '',
    '**Overall**',
    `**${pct(statements)}%** (${statements.covered}/${statements.total})`,
    `**${pct(branches)}%** (${branches.covered}/${branches.total})`,
    `**${pct(functions)}%** (${functions.covered}/${functions.total})`,
    `**${pct(lines)}%** (${lines.covered}/${lines.total})`,
    '',
  ]
    .join(' | ')
    .trim();
}

(async function() {
  const { workspaces } = JSON.parse(await fs.readFile('./package.json', 'utf8'));
  const packages = workspaces.packages.map(w => w.replace(/^packages\//, ''));
  const coverageFiles = (await Promise.all(packages.map(readCoverage))).filter(_ => _);

  if (coverageFiles.length === 0) {
    return;
  }

  const overall = {
    lines: { total: 0, covered: 0 },
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
  };

  const root = await fs.realpath('./packages');

  let summary = '';

  let details = '';

  for (const { workspace, cov } of coverageFiles) {
    for (const [file, coverage] of Object.entries(cov)) {
      if (file === 'total') {
        addToOverall(overall, coverage);
        summary += workspaceSummary(workspace, coverage) + '\n';
        details += workspaceHeader(workspace, Object.values(cov).length) + '\n';
        continue;
      }

      const rebased = file.replace(join(root, workspace) + '/', '');
      details += fileCoverageRow(rebased, coverage) + '\n';
    }
    details += '\n</details>\n\n';
  }

  console.log(
    `
| Package | Statements | Branches | Functions | Lines |
|:--------|:----------:|:--------:|:---------:|:-----:|
${coverageFiles.length > 1 ? overallSummaryRow(overall) + '\n' : ''}${summary}

${details}
  `.trim(),
  );
})().catch(e => {
  console.error(e);
  process.exit(e.code || 1);
});
