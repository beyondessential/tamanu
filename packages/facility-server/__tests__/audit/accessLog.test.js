import { createTestContext } from '../utilities';

describe('accessLog', () => {
  let ctx;
  let sequelize;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  it.todo('create a log with appropriate details when a user hits a patient endpoint');
});
