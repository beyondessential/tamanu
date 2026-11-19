import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { closeDatabase, createTestDatabase } from '../utilities';
import {
  down,
  up,
} from '../../src/migrations/1792100677116-groupAiSettingsUnderExperimentalAi';

describe('groupAiSettingsUnderExperimentalAi migration', () => {
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

  const seed = async rows => {
    for (const [key, value, scope] of rows) {
      await models.Setting.create({ key, value, scope });
    }
  };

  const aliveSettings = async () =>
    Object.fromEntries(
      (await models.Setting.findAll({ order: [['key', 'ASC']] })).map(setting => [
        setting.key,
        { value: setting.value, scope: setting.scope },
      ]),
    );

  const before = [
    ['ai.enabled', true, 'central'],
    ['ai.anthropicModel', 'claude-opus-5', 'central'],
    ['ai.anthropicFastModel', 'claude-haiku-5', 'central'],
    ['ai.anthropicApiKey', 'encrypted', 'central'],
    ['patientSummary.enabled', true, 'global'],
    ['patientSummary.prompts', 'patient prompt', 'global'],
    ['encounterSummary.enabled', false, 'global'],
    ['formBuilder.prompts.processMessage', 'process', 'central'],
  ];

  it('moves stored values to the new keys and copies the switch and model to both', async () => {
    await seed(before);

    await up(sequelize.getQueryInterface());

    expect(await aliveSettings()).toEqual({
      'ai.anthropicApiKey': { value: 'encrypted', scope: 'central' },
      'experimentalAi.enabled': { value: true, scope: 'global' },
      'experimentalAi.model': { value: 'claude-opus-5', scope: 'global' },
      'experimentalAi.patientSummary.enabled': { value: true, scope: 'global' },
      'experimentalAi.patientSummary.prompts': { value: 'patient prompt', scope: 'global' },
      'experimentalAi.encounterSummary.enabled': { value: false, scope: 'global' },
      'formBuilder.enabled': { value: true, scope: 'central' },
      'formBuilder.model': { value: 'claude-opus-5', scope: 'central' },
      'formBuilder.fastModel': { value: 'claude-haiku-5', scope: 'central' },
      'formBuilder.prompts.processMessage': { value: 'process', scope: 'central' },
    });
  });

  it('leaves soft-deleted rows under their old keys', async () => {
    const deleted = await models.Setting.create({
      key: 'patientSummary.enabled',
      value: false,
      scope: 'global',
    });
    await deleted.destroy();

    await up(sequelize.getQueryInterface());

    const row = await models.Setting.findByPk(deleted.id, { paranoid: false });
    expect(row.key).toBe('patientSummary.enabled');
  });

  it('restores the old keys on down', async () => {
    await seed(before);

    await up(sequelize.getQueryInterface());
    await down(sequelize.getQueryInterface());

    expect(await aliveSettings()).toEqual(
      Object.fromEntries(before.map(([key, value, scope]) => [key, { value, scope }])),
    );
  });
});
