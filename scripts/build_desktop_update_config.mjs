import { writeFileSync, readFileSync } from 'fs';

// Read in desktop's package.json
const pkgPath = './packages/desktop/package.json'
const pkgRaw = readFileSync(pkgPath);
const pkg = JSON.parse(pkgRaw);

// Get which deployment we're going for
const branch = process.env.CI_BRANCH;
const deployment = branch.replace("release-desktop-", "");

// Determine build folder
const buildFolder = `desktop/${deployment}`;
pkg.build.publish.path = buildFolder;

// Determine installation method:
// - perMachine = false: install to appdata
// - perMachine = true: install to Program Files
// Add new deployments here as required.
const programFilesDeployments = [
  'aspen-medical-fiji',
  'aspen-demo',
  'tuvalu',
];
pkg.build.nsis.perMachine = programFilesDeployments.includes(deployment);

// Write back to desktop package.json to be read by build task
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
