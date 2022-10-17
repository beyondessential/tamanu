import { writeFileSync, readFileSync } from 'fs';

// read in desktop's package.json
const pkgPath = './packages/desktop/package.json'
const pkgRaw = readFileSync(pkgPath);
const pkg = JSON.parse(pkgRaw);

// get which deployment we're going for
const branch = process.env.CI_BRANCH;
const deployment = branch.replace("release-desktop-", "");

// determine build folder
const buildFolder = `desktop/${deployment}`;
pkg.build.publish.path = buildFolder;

// determine installation method
// - false: install to appdata
// - true: install to Program Files
const programFilesDeployments = [
  'aspen-medical-fiji',
  'aspen-demo',
  'tuvalu',
];
pkg.build.nsis.perMachine = programFilesDeployments.includes(deployment);

// write back to desktop package.json to be read by build task
writeFileSync(
  'packages/desktop/package.json',
  JSON.stringify(pkg, null, 2)
);
