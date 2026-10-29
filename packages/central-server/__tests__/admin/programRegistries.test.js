import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Admin program registry metadata', () => {
  let ctx;
  let models;
  let adminApp;
  let registry;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');

    const program = await models.Program.create(fake(models.Program));
    registry = await models.ProgramRegistry.create({
      ...fake(models.ProgramRegistry),
      programId: program.id,
      mandatoryConditionEnabled: false,
    });
  });

  afterAll(() => ctx.close());

  it('updates mandatoryConditionEnabled', async () => {
    const result = await adminApp
      .patch(`/v1/admin/programRegistry/${registry.id}`)
      .send({ mandatoryConditionEnabled: true });
    expect(result).toHaveSucceeded();

    await registry.reload();
    expect(registry.mandatoryConditionEnabled).toBe(true);
  });
});
