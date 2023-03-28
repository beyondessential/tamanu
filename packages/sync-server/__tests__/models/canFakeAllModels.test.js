import { Sequelize, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from 'shared/models/Model';
import * as modelClasses from 'shared/models';

import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from '../utilities';

export class NoGoodModel extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        }
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }
}

jest.setTimeout(30000);

describe('Setting', () => {
  let models;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(async () => {
    await ctx.close();
  });

  it.each(Object.keys(modelClasses).slice(0,30))("Fake model: %s", async (modelName) => {
    const model = models[modelName]
    const shouldTest = Object.entries(model.tableAttributes).every(([name, attribute]) => !(attribute.type instanceof DataTypes.JSONB))
    
    if (shouldTest) {
      const fakedModel = await model.create(fake(model));
      expect(fakedModel).toHaveProperty('id');
    }
  });

  it("Does error when trying to create a fake model", async () => {
    expect(() => NoGoodModel.create(fake(NoGoodModel))).rejects.toThrow('id');
  });
});
