import { writeFile, readFile, cp } from 'fs/promises';
import { createInterface } from 'readline';
import { parseDocument } from 'yaml';

const PKG_PATH = './package.json';

async function packageExists(name) {
  const pkg = JSON.parse(await readFile(PKG_PATH));
  return pkg.workspaces.packages.includes(`packages/${name}`);
}

async function createPackage(name) {
  const pkg = JSON.parse(await readFile(PKG_PATH));

  console.log('Copying template...');
  await cp('./packages/.new-package', `./packages/${name}`, { recursive: true });

  console.log('Updating package.json...');
  const newPkgPath = `./packages/${name}/package.json`;
  const newPkg = JSON.parse(await readFile(newPkgPath));
  newPkg.name = `@tamanu/${name}`;
  newPkg.version = pkg.version;
  await writeFile(newPkgPath, JSON.stringify(newPkg, null, 2) + '\n');

  console.log('Adding to workspace...');
  pkg.workspaces.packages.push(`packages/${name}`);
  await writeFile(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');

  console.log("All done! Don't forget to run yarn and yarn build-shared.");
  process.exit(0);
}

const name = process.argv.slice(2)?.[0]?.trim();
if (name) {
  // by argument
  if (await packageExists(name)) {
    console.error(`Package ${name} already exists`);
    process.exit(1);
  }

  await createPackage(name);
} else {
  // by prompt
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Name of new package? ',
  });

  rl.prompt();

  rl.on('line', async line => {
    const name = line.trim();

    if (!name.length) {
      console.error('Please enter a name');
      rl.prompt();
      return;
    }

    if (await packageExists(name)) {
      console.error(`Package ${name} already exists`);
      rl.prompt();
      return;
    }

    try {
      await createPackage(name);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
  });
}
