import { randomUUID } from 'node:crypto';
import { QueryTypes } from 'sequelize';
import { createTestContext } from './utilities';

describe('debug', () => {
  let ctx, sequelize;
  beforeAll(async () => { ctx = await createTestContext(); sequelize = ctx.store.sequelize; });
  afterAll(async () => ctx.close());

  it('counts after the same setup', async () => {
    await sequelize.query('DELETE FROM attachments');
    await sequelize.query('DELETE FROM assets');
    await sequelize.query(`DELETE FROM logs.changes WHERE table_name IN ('attachments','assets')`);

    await sequelize.query(
      `INSERT INTO attachments (id, type, size, data) VALUES ($id, 'image/png', 3, $data)`,
      { bind: { id: randomUUID(), data: Buffer.from('one') } },
    );
    await sequelize.query(
      `INSERT INTO assets (id, name, type, data) VALUES ($id, 'letterhead', 'image/png', $data)`,
      { bind: { id: randomUUID(), data: Buffer.from('two') } },
    );
    const rows = await sequelize.query('SELECT id, octet_length(data) AS len FROM attachments', { type: QueryTypes.SELECT });
    console.log('ATTACHMENT ROWS:', JSON.stringify(rows));
    const c = await sequelize.query(`SELECT count(*) AS count FROM attachments WHERE data IS NOT NULL`, { type: QueryTypes.SELECT, plain: true });
    console.log('COUNT PLAIN:', JSON.stringify(c));
  });
});
