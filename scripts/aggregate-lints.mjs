import { promises as fs } from 'fs';
import { join } from 'path';

async function readLints(workspace) {
  try {
    const file = await fs.readFile(`./packages/${workspace}/lint-summary.json`, 'utf8');
    return { workspace, lint: JSON.parse(file) };
  } catch (e) {
    return null;
  }
}

function ruleIsStylistic(id, rules) {
  return id && (id.startsWith('stylistic') || rules.get(id).type === 'layout');
}

function errorLine({ line, column, ruleId, message }, rules) {
  const rule = rules.get(ruleId);
  const ruleUrl = ((rule || {}).docs || {}).url;
  return [
    `_${line}:${column}_`,
    message
      .replace(/[\r\n⏎·]+/g, ' ')
      .replace(/`{2,}/g, '`')
      .slice(0, 100),
    ruleUrl ? `([${ruleId}](${ruleUrl}))` : `(${ruleId})`,
  ].join(' ');
}

function pct(part, total) {
  if (total === 0) return 0;
  return Math.round((100 * part) / total);
}

(async function() {
  const { workspaces } = JSON.parse(await fs.readFile('./package.json', 'utf8'));
  const packages = workspaces.packages.map(w => w.replace(/^packages\//, ''));

  const lintsFiles = (await Promise.all(packages.map(readLints))).filter(_ => _);
  if (lintsFiles.length === 0) {
    return;
  }

  const root = await fs.realpath('./packages');

  const rules = new Map();
  const allFiles = new Set();

  const total = {
    lint: 0,
    style: 0,
    files: 0,
  };

  const byWorkspace = new Map();
  for (const {
    workspace,
    lint: {
      metadata: { rulesMeta },
      results,
    },
  } of lintsFiles) {
    for (const [id, rule] of Object.entries(rulesMeta)) {
      rules.set(id, rule);
    }

    const byFile = new Map();
    for (const { filePath, messages } of results) {
      allFiles.add(filePath);

      const fileErrors = [];
      for (const message of messages) {
        if (ruleIsStylistic(message.ruleId, rules)) {
          total.style += 1;
        } else {
          total.lint += 1;
          fileErrors.push(errorLine(message, rules));
        }
      }

      if (fileErrors.length > 0) {
        const rebased = filePath.replace(join(root, workspace) + '/', '');
        byFile.set(rebased, fileErrors);
        total.files += 1;
      }
    }

    byWorkspace.set(workspace, byFile);
  }

  if (total.lint + total.style === 0) {
    console.log('No linting errors found! 🎉');
    return;
  }

  console.log(
    `- Checked ${allFiles.size} files, ${total.files} have errors (${pct(
      total.files,
      allFiles.size,
    )}%)`,
  );
  if (total.style > 0) {
    console.log(`- **${total.style} style errors**\n  - Either run \`yarn lint-fix\` locally, or:\n  - Say \`!lint-fix\` in a comment to have the bot fix them for you`);
  }
  if (total.lint > 0) {
    console.log(`- **${total.lint} code errors** (detail below)`);

    for (const [workspace, byFile] of byWorkspace) {
      if (byFile.size === 0) {
        continue;
      }

      console.log(`\n#### Workspace: ${workspace}\n`);

      for (const [file, errors] of byFile) {
        if (errors.length === 0) {
          continue;
        }

        console.log(`- ${file}`);
        for (const error of errors) {
          console.log(`  - ${error}`);
        }
      }
    }
  }
})().catch(e => {
  console.error(e);
  process.exit(e.code || 1);
});
