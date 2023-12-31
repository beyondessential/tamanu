import { prepareQuery } from '../../app/utils/prepareQuery';
import { createTestContext } from '../utilities';

describe('prepareQuery()', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
  });

  afterAll(() => {
    ctx.close();
  });

  it('should create sql from sequelize query', async () => {
    const { Encounter } = ctx.store.models;
    const query = {
      where: {
        id: '123',
      },
      attributes: ['id', 'deleted_at', 'updated_at'],
    };

    const sql = await prepareQuery(Encounter, query);
    expect(sql).toEqual(
      `SELECT "id", "deleted_at", "updated_at" FROM "encounters" AS "Encounter" WHERE ("Encounter"."deleted_at" IS NULL AND "Encounter"."id" = '123');`,
    );
  });
});
