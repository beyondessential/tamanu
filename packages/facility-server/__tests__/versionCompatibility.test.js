import path from 'path';
import fs from 'fs';
import { lte as semverLte } from 'semver';
import { MIN_CLIENT_VERSION, MAX_CLIENT_VERSION } from '../dist/middleware/versionCompatibility';

async function readVersion(pkg) {
  const normalisedPath = path.resolve(__dirname, '..', '..', '..', 'packages', pkg, 'package.json');
  const content = await fs.promises.readFile(normalisedPath);
  return JSON.parse(content).version;
}

describe('Other packages', () => {
  it('Should support the current version of web', async () => {
    const webVersion = await readVersion('web');

    expect(semverLte(MIN_CLIENT_VERSION, webVersion)).toBe(true);
    expect(semverLte(webVersion, MAX_CLIENT_VERSION)).toBe(true);
  });

  it('Should support the current version of central-server', async () => {
    const centralVersion = await readVersion('central-server');

    expect(semverLte(MIN_CLIENT_VERSION, centralVersion)).toBe(true);
    expect(semverLte(centralVersion, MAX_CLIENT_VERSION)).toBe(true);
  });
});
