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

// Build only NSIS in codeship
pkg.build.win.target = ['nsis'];

// Determine installation method:
// - omitted in this list: install to appdata
// - included: install to Program Files
// Add new deployments here as required.
const programFilesDeployments = ['aspen-medical-fiji', 'aspen-demo', 'tuvalu'];
const isProgramFiles = programFilesDeployments.includes(deployment);
pkg.build.nsis.perMachine = isProgramFiles;

// Write back to desktop package.json to be read by build task
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

const installTarget = isProgramFiles ? 'Program Files' : 'appdata';
console.log(`Publishing to ${buildFolder} (will install to ${installTarget})`);
