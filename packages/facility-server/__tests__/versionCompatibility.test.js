import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import path from 'path';
import fs from 'fs';
import { lte as semverLte } from 'semver';
import { SERVER_TYPES, VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';
import {
  MAX_CLIENT_VERSION,
  MIN_CLIENT_VERSION,
  VERSION_CONTROLLED_CLIENTS,
} from '../app/middleware/versionCompatibility';
import { createTestContext } from './utilities';

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

describe('Version compatibility', () => {
  let ctx;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
  });

  afterAll(() => ctx.close());

  describe('Web app client version checking', () => {
    const { min } = VERSION_CONTROLLED_CLIENTS[SERVER_TYPES.WEBAPP];

    it('Should allow a supported client', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': SERVER_TYPES.WEBAPP,
        'X-Version': min,
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('index', true);
    });

    it('Should deny a client under the minimum', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': SERVER_TYPES.WEBAPP,
        'X-Version': '0.0.1',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.LOW,
      );
    });

    it('Should deny a client over the maximum', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': SERVER_TYPES.WEBAPP,
        'X-Version': '999.999.999',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.HIGH,
      );
    });
  });

  describe('Third-party integration client version checking', () => {
    it.each(['0.0.1', '1.0.0', '999.999.999'])(
      'Should allow version %s of an unspecified client (e.g. a third-party integration that does not send X-Tamanu-Client)',
      async version => {
        const response = await app.get('/').unset('X-Tamanu-Client').set({
          'X-Version': version,
        });
        expect(response).toHaveSucceeded();
        expect(response.body).toHaveProperty('index', true);
      },
    );

    it.each(['0.0.1', '1.0.0', '999.999.999'])(
      'Should allow version %s of a client type that is not version-controlled (e.g. SENAITE)',
      async version => {
        const response = await app.get('/').set({
          'X-Tamanu-Client': 'senaite.tamanu',
          'X-Version': version,
        });
        expect(response).toHaveSucceeded();
        expect(response.body).toHaveProperty('index', true);
      },
    );
  });
});
