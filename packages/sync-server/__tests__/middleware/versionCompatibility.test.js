import { VERSION_COMPATIBILITY_ERRORS } from 'shared/constants';
import { createTestContext } from '../utilities';
import { SUPPORTED_CLIENT_VERSIONS } from '../../app/middleware/versionCompatibility';

const MIN_MOBILE_VERSION = SUPPORTED_CLIENT_VERSIONS['Tamanu Mobile'].min;
const MIN_LAN_VERSION = SUPPORTED_CLIENT_VERSIONS['Tamanu LAN Server'].min;

describe('Version compatibility', () => {
  let baseApp;
  let app;
  let close;
  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    app = await baseApp.asRole('practitioner');
  });

  afterAll(async () => close());

  describe('LAN server client version checking', () => {
    it('Should allow a supported client', async () => {
      const response = await app.get('/').set({
        'X-Runtime': 'Tamanu LAN Server',
        'X-Version': MIN_LAN_VERSION,
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('index', true);
    });

    it('Should deny a client under the minimum', async () => {
      const response = await app.get('/').set({
        'X-Runtime': 'Tamanu LAN Server',
        'X-Version': '0.0.1',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.LOW,
      );
    });

    it('Should deny a client over the maximum', async () => {
      const response = await app.get('/').set({
        'X-Runtime': 'Tamanu LAN Server',
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
        'X-Runtime': 'Tamanu Mobile',
        'X-Version': MIN_MOBILE_VERSION,
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('index', true);
    });

    it('Should deny a client under the minimum', async () => {
      const response = await app.get('/').set({
        'X-Runtime': 'Tamanu Mobile',
        'X-Version': '0.0.1',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.LOW,
      );
    });

    it('Should deny a client over the maximum', async () => {
      const response = await app.get('/').set({
        'X-Runtime': 'Tamanu Mobile',
        'X-Version': '10.2.1',
      });

      expect(response).not.toHaveSucceeded();
      expect(JSON.parse(response.error.text).error.message).toEqual(
        VERSION_COMPATIBILITY_ERRORS.HIGH,
      );
    });
  });

  describe('Other client version checking', () => {
    it('Should allow any version of an unspecified client (so that tests work)', async () => {
      await Promise.all(
        ['0.0.1', '1.0.0', '1.0.9', '999.999.999'].map(async version => {
          const response = await app.get('/').set({
            'X-Version': version,
          });
          expect(response).toHaveSucceeded();
          expect(response.body).toHaveProperty('index', true);
        }),
      );
    });

    it('Should deny an unknown client type of any version', async () => {
      await Promise.all(
        ['0.0.1', '1.0.0', '1.0.9', '999.999.999'].map(async version => {
          const response = await app.get('/').set({
            'X-Runtime': 'Unknown Client',
            'X-Version': version,
          });
          expect(response).not.toHaveSucceeded();
        }),
      );
    });
  });
});
