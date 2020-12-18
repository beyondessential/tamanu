import wayfarer from 'wayfarer';
import { Op, Sequelize } from 'sequelize';
import { initDatabase } from 'shared/services/database';

const ensureNumber = input => {
  if (typeof input === 'string') {
    const parsed = parseInt(input, 10);
    return parsed; // might be NaN
  }
  return input;
};

const convertToDbFromSyncRecord = syncRecord => {
  const { data, hashedPassword, lastSynced, ...metadata } = syncRecord;

  return {
    password: hashedPassword,
    ...metadata,
    ...data,
  };
};

const convertToSyncRecordFromDb = dbRecord => {
  const { id, updatedAt, createdAt, deletedAt, password, ...data } = dbRecord;

  return {
    lastSynced: updatedAt?.valueOf(),
    ...(deletedAt ? { isDeleted: true } : {}),
    data: {
      id,
      ...(deletedAt ? {} : data),
    },
  };
};

export class SqlWrapper {
  models = null;

  sequelize = null;

  constructor(dbOptions) {
    // init database
    this._dbPromise = initDatabase(dbOptions);
  }

  async init() {
    const { sequelize, models } = await this._dbPromise;
    this.sequelize = sequelize;
    this.models = models;
    this.channelRouter = this.buildChannelRouter();
    return this;
  }

  async close() {
    await this.sequelize.close();
  }

  buildChannelRouter() {
    const channelRouter = wayfarer();
    [
      ['patient', this.models.Patient],
      ['patient/:id/todo', this.models.Todo],
      ['reference', this.models.ReferenceData],
      ['survey', this.models.Survey],
      ['user', this.models.User],
      ['vaccination', this.models.Vaccination],
    ].forEach(([route, Model]) => {
      channelRouter.on(route, async (urlParams, f) => {
        const params = { ...urlParams, route };
        return f(Model, params);
      });
    });
    return channelRouter;
  }

  // ONLY FOR TESTS, ignores "paranoid"'s soft deletion
  unsafeRemoveAllOfChannel(channel) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('DO NOT use unsafeRemoveAllOfChannel outside tests!');
    }
    return this.channelRouter(channel, async Model => {
      return Model.destroy({ truncate: true, cascade: true, force: true });
    });
  }

  async insert(channel, syncRecord) {
    const record = convertToDbFromSyncRecord(syncRecord);
    return this.channelRouter(channel, async Model => {
      return Model.upsert(record);
    });
  }

  async countSince(channel, since) {
    return this.channelRouter(channel, async Model => {
      return Model.count({
        where: {
          updatedAt: { [Op.gte]: ensureNumber(since) },
        },
        paranoid: false,
      });
    });
  }

  async findSince(channel, since, { limit, offset } = {}) {
    return this.channelRouter(channel, async Model => {
      const records = await Model.findAll({
        limit,
        offset,
        where: {
          updatedAt: { [Op.gte]: ensureNumber(since) },
        },
        order: ['updatedAt', 'id'],
        paranoid: false,
      });
      return records.map(result => {
        const plainRecord = result.get({ plain: true });
        return convertToSyncRecordFromDb(plainRecord);
      });
    });
  }

  markRecordDeleted(channel, id) {
    return this.channelRouter(channel, async Model => {
      // use update instead of destroy so we can change both fields
      return Model.update(
        {
          deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
          updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        {
          where: { id },
        },
      ).then(([num]) => num);
    });
  }

  //------------------------------------
  // required for auth middleware

  async findUser(email) {
    const user = await this.models.User.findOne({
      where: { email },
    });
    if (!user) {
      return null;
    }
    return {
      ...convertToSyncRecordFromDb(user.get({ plain: true })),
      hashedPassword: user.password,
    };
  }

  async findUserById(id) {
    const user = await this.models.User.findByPk(id);
    if (!user) {
      return null;
    }
    return {

      ...convertToSyncRecordFromDb(user?.get({ plain: true })),
      hashedPassword: user.password,
    };
  }
}
