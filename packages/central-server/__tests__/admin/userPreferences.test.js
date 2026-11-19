import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { TABLE_PAGE_SIZE_PREFERENCE_KEYS } from '@tamanu/constants';

import { createTestContext } from '../utilities';

const ENDPOINT = '/api/admin/user/userPreferences';
const PREFERENCE_KEY = TABLE_PAGE_SIZE_PREFERENCE_KEYS.USER_PROFILES;

// The admin panel remembers its tables' page sizes here, with no facility
// spec: TPAGE#remembered-page-size
describe('admin user preferences', () => {
  let ctx;
  let baseApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });
  afterAll(() => ctx.close());

  it('rejects unauthenticated requests', async () => {
    expect(await baseApp.get(ENDPOINT)).toHaveRequestError();
    expect(
      await baseApp.post(ENDPOINT).send({ key: PREFERENCE_KEY, value: 100 }),
    ).toHaveRequestError();
  });

  it('reads back the latest size saved with no facility', async () => {
    const app = await baseApp.asRole('admin');

    expect(await app.post(ENDPOINT).send({ key: PREFERENCE_KEY, value: 100 })).toHaveSucceeded();
    expect(await app.post(ENDPOINT).send({ key: PREFERENCE_KEY, value: 50 })).toHaveSucceeded();

    const result = await app.get(ENDPOINT);
    expect(result).toHaveSucceeded();
    expect(result.body[PREFERENCE_KEY]).toBe(50);
  });

  it("keeps each user's sizes to themselves", async () => {
    const userWhoPicked = await baseApp.asRole('admin');
    const otherUser = await baseApp.asRole('admin');

    await userWhoPicked.post(ENDPOINT).send({ key: PREFERENCE_KEY, value: 100 });

    const result = await otherUser.get(ENDPOINT);
    expect(result).toHaveSucceeded();
    expect(result.body[PREFERENCE_KEY]).toBeUndefined();
  });
});
