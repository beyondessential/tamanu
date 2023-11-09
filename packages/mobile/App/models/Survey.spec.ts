import { Database } from '~/infra/db';

beforeAll(async () => {
  await Database.connect();
});

describe('Survey', () => {
  describe('getVitalsSurvey', () => {
    it("returns null if there's no vitals survey", async () => {
      await expect(Database.models.Survey.getVitalsSurvey()).resolves.toEqual(null);
    });
  });
});
