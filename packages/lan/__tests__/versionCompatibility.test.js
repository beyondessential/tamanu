import path from 'path';
import fs from 'fs';
import { gte as semverGte, lte as semverLte } from 'semver';
import { MIN_CLIENT_VERSION, MAX_CLIENT_VERSION } from '../app/middleware/versionCompatibility';

describe('Other packages', () => {
  let versions;
  beforeAll(async () => {
    const packageFiles = ['packages/desktop/package.json', 'packages/desktop/app/package.json'];
    versions = await Promise.all(
      packageFiles.map(async filePath => {
        const relativePath = `../../../${filePath}`.split('/');
        const normalisedPath = path.resolve(__dirname, ...relativePath);
        const content = await fs.promises.readFile(normalisedPath);
        return [filePath, JSON.parse(content).version];
      }),
    );
  });

  it('Should support the current version of desktop', async () => {
    const desktopVersions = versions.map(([, v]) => v);
    desktopVersions.forEach(v => expect(semverLte(MIN_CLIENT_VERSION, v)).toBe(true));
    desktopVersions.forEach(v => expect(semverLte(v, MAX_CLIENT_VERSION)).toBe(true));
  });
});
