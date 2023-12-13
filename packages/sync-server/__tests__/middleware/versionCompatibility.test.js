import { VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';
import { promises as fs } from 'fs';
import path from 'path';
import { SUPPORTED_CLIENT_VERSIONS } from '../../app/middleware/versionCompatibility';
import { createTestContext } from '../utilities';

const MIN_MOBILE_VERSION = SUPPORTED_CLIENT_VERSIONS['Tamanu Mobile'].min;
const MIN_LAN_VERSION = SUPPORTED_CLIENT_VERSIONS['Tamanu LAN Server'].min;

describe('Version compatibility', () => {
  let baseApp;
  let app;
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    app = await baseApp.asRole('practitioner');
  });

  afterAll(() => ctx.close());

  describe('LAN server client version checking', () => {
    it('Should allow a supported client', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': 'Tamanu LAN Server',
        'X-Version': MIN_LAN_VERSION,
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('index', true);
    });

    it('Should deny a client under the minimum', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': 'Tamanu LAN Server',
        'X-Version': '0.0.1',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.LOW,
      );
    });

    it('Should deny a client over the maximum', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': 'Tamanu LAN Server',
        'X-Version': '10.2.1',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.HIGH,
      );
    });
  });

  describe('Mobile client version checking', () => {
    it('Should allow a supported client', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': 'Tamanu Mobile',
        'X-Version': MIN_MOBILE_VERSION,
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('index', true);
    });

    it('Should deny a client under the minimum', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': 'Tamanu Mobile',
        'X-Version': '0.0.1',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.LOW,
      );
    });

    it('Should deny a client over the maximum', async () => {
      const response = await app.get('/').set({
        'X-Tamanu-Client': 'Tamanu Mobile',
        'X-Version': '10.2.1',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.HIGH,
      );
    });
  });

  describe('Other client version checking', () => {
    it.each(['0.0.1', '1.0.0', '1.0.9', '999.999.999'])(
      'Should allow version %s of an unspecified client (so that tests work)',
      async version => {
        const response = await app
          .get('/')
          .unset('X-Tamanu-Client')
          .set({
            'X-Version': version,
          });
        expect(response).toHaveSucceeded();
        expect(response.body).toHaveProperty('index', true);
      },
    );

    it.each(['0.0.1', '1.0.0', '1.0.9', '999.999.999'])(
      'Should deny version %s of an an unknown client type of any version',
      async version => {
        const response = await app.get('/').set({
          'X-Tamanu-Client': 'Unknown Client',
          'X-Version': version,
        });
        expect(response).not.toHaveSucceeded();
      },
    );
  });

  describe('Other packages', () => {
    let versions;
    beforeAll(async () => {
      const packageFiles = [
        'package.json',
        'packages/desktop/package.json',
        'packages/desktop/app/package.json',
        'packages/sync-server/package.json',
        'packages/lan/package.json',
        'packages/shared/package.json',
        'packages/meta-server/package.json',
        'packages/scripts/package.json',
      ];
      versions = await Promise.all(
        packageFiles.map(async filePath => {
          const relativePath = `../../../../${filePath}`.split('/');
          const normalisedPath = path.resolve(__dirname, ...relativePath);
          const content = await fs.readFile(normalisedPath);
          return [filePath, JSON.parse(content).version];
        }),
      );
    });

    it('Should have the same version across all packages', async () => {
      const [firstVersion, ...rest] = versions.map(([, v]) => v);
      rest.forEach(subsequentVersion => {
        expect(subsequentVersion).toEqual(firstVersion);
      });
    });

    it('Should support the current version of the lan server', async () => {
      const lanVersion = versions.find(([filePath]) => filePath === 'packages/lan/package.json')[1];
      const response = await app.get('/').set({
        'X-Tamanu-Client': 'Tamanu LAN Server',
        'X-Version': lanVersion,
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('index', true);
    });
  });
});
