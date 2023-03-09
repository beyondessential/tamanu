import { readFile, writeFile } from 'fs/promises';

const { version, description, homepage, repository, author, license } = JSON.parse(
  await readFile('package.json', 'utf8'),
);

await writeFile(
  'src/package.json',
  JSON.stringify({
    name: 'shared',
    main: 'index.js',
    private: true,
    version,
    author,
    description: `${description} (generated)`,
    homepage,
    license,
    repository,
  }, null, 2),
);
