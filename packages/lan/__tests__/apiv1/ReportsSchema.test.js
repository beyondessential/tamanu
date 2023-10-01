import { QueryTypes } from 'sequelize';
import { createTestContext } from '../utilities';

describe('ReportSchemas', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext({ mockReportingSchema: true });
    await ctx.sequelize.query(`
      CREATE TABLE "test-reporting-table" (
        "id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        PRIMARY KEY ("id")
      );
      INSERT INTO "test-reporting-table" ("id", "name", "createdAt", "updatedAt") VALUES ('1', 'test', '2020-01-01', '2020-01-01'), ('2', 'test2', '2020-01-01', '2020-01-01');
    `);
  });
  afterAll(async () => {
    await ctx.sequelize.query(`DROP TABLE "test-reporting-table";`);
    await ctx.close();
  });

  it('reporting can be used', async () => {
    const result = await ctx.sequelize.query(`SELECT * FROM "test-reporting-table";`, {
      type: QueryTypes.SELECT,
    });
    expect(result).toEqual([
      {
        id: 1,
        name: 'test',
        createdAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2020-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        name: 'test2',
        createdAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2020-01-01T00:00:00.000Z',
      },
    ]);
  });
});
