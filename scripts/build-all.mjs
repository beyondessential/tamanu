import { execFileSync } from 'node:child_process';
import { parseArgs, styleText } from 'node:util';
import { doWithAllPackages } from './_do-with-all-packages.mjs';

const { values, positionals } = parseArgs({
  options: {
    'shared-only': { type: 'boolean', default: false },
    clean: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

const target = positionals[0];
if (target) {
  log(`Building shared+target: ${target}`);
}

const buildScript = values.clean ? 'clean-build' : 'build';

doWithAllPackages((name, pkg, _pkgPath, isShared) => {
  console.log(); // Just for visual separation
  const styledName = stylePackageName(name);

  if (values['shared-only'] && !isShared) {
    log(`Skipping ${styledName}`, `(not a shared package)`);
    return;
  }

  if (!pkg.scripts?.[buildScript]) {
    if (values.clean && pkg.scripts?.build) {
      log(
        `Skipping clean build for ${styledName}`,
        `(no ${styleSubcommand('clean-build')} script)`,
      );
      return;
    }

    log(`Skipping ${styledName}`, `(no ${styleSubcommand(buildScript)} script)`);
    return;
  }

  if (target && !isShared && name != target) {
    log(`Skipping ${styledName}`, `(not the target)`);
    return;
  }

  log(`Building ${styledName}…`);
  execFileSync('npm', ['--workspace', pkg.name, 'run', buildScript], { stdio: 'inherit' });
});

function stylePackageName(str) {
  return styleText(['yellow'], str);
}
function styleSubcommand(str) {
  return styleText(['cyan'], str);
}
function log(...args) {
  console.log(styleText(['dim'], '[build-all]'), ...args);
}
