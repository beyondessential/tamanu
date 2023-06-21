import { writeFileSync, readFileSync } from 'fs';

// Read in desktop's package.json
const pkgPath = './packages/desktop/package.json';
const pkgRaw = readFileSync(pkgPath);
const pkg = JSON.parse(pkgRaw);

// Get which deployment we're going for
const branch = process.env.CI_BRANCH;
const deployment = branch.replace('release-desktop-', '');

// Determine build folder
const buildFolder = `desktop/${deployment}`;
pkg.build.publish.path = buildFolder;

// Determine installation method:
// - omitted in this list: install to appdata
// - included: install to Program Files
//   - nsis: produce an exe, with auto-updates
//   - msi: produce an msi, without auto-updates
// Add new deployments here as required.
const programFilesDeployments = new Map([
  ['aspen-medical-fiji', 'msi'],
  ['aspen-demo', 'msi'],
  ['tuvalu', 'nsis'],
]);

let installTarget;
switch (programFilesDeployments.get(deployment)) {
  case 'nsis':
    pkg.build.nsis.perMachine = true;
    installTarget = 'Program Files';
    break;
  case 'msi':
    installTarget = 'Program Files';
    delete pkg.build.nsis;
    pkg.build.msi = {
      oneClick: false,
      perMachine: true,
    };
    break;
  default:
    pkg.build.nsis.perMachine = false;
    installTarget = 'appdata';
}

// Write back to desktop package.json to be read by build task
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`Publishing to ${buildFolder} (will install to ${installTarget})`);
