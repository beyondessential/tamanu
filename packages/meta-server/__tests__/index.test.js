import supertest from 'supertest';
import { createApp } from '../app/createApp';

const app = createApp();
const testApp = supertest(app);

describe('Meta server', () => {
  it('should list active sync servers', async () => {
    const response = await testApp.get('/servers');
    expect(response.statusCode).toEqual(200);
    expect(Array.isArray(response.body)).toEqual(true);
    expect(response.body.length).toBeGreaterThan(0);

    const first = response.body[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('host');
    expect(first).toHaveProperty('type');
  });

  ['desktop', 'mobile', 'lan'].map(appType => {
    it(`should list latest ${appType} version`, async () => {
      const response = await testApp.get(`/version/${appType}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toHaveProperty('appType', appType);
      expect(response.body).toHaveProperty('version');
    });
  });

  it('should always have https:// in the server URLs', async () => {
    const response = await testApp.get('/servers');
    response.body.forEach(({ host }) => {
      expect(host).toMatch(/^https:\/\/.*/);
    });
  });
});
