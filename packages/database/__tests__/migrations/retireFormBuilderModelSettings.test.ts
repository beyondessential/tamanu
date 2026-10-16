import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { closeDatabase, createTestDatabase } from '../utilities';
import { up } from '../../src/migrations/1792120111031-retireFormBuilderModelSettings';

describe('retireFormBuilderModelSettings migration', () => {
  let models;
  let sequelize;

  beforeAll(async () => {
    ({ models, sequelize } = await createTestDatabase());
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await models.Setting.destroy({ where: {}, force: true });
  });

  it('removes the central model choices and keeps the rest of the form builder', async () => {
    for (const [key, value] of [
      ['formBuilder.enabled', true],
      ['formBuilder.model', 'claude-opus-5'],
      ['formBuilder.fastModel', 'claude-haiku-5'],
      ['formBuilder.prompts.processMessage', 'process'],
    ]) {
      await models.Setting.create({ key, value, scope: 'central' });
    }

    await up(sequelize.getQueryInterface());

    const keys = (await models.Setting.findAll({ order: [['key', 'ASC']] })).map(s => s.key);
    expect(keys).toEqual(['formBuilder.enabled', 'formBuilder.prompts.processMessage']);
  });
});
