import { Database } from '~/infra/db';

jest.setTimeout(60000); // can be slow to create/delete records

beforeAll(async () => {
  await Database.connect();
});

describe('getLatestAnswerForSurveyResponseAnswer', () => {
  it.todo('returns undefined if no answers exist for the SurveyResponseAnswer');

  it.todo('gets latest answer for patient');
});
