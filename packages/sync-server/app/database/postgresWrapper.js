import wayfarer from 'wayfarer';
import { Op } from 'sequelize';
import { initDatabase } from 'shared/services/database';

const convertToPgFromSyncRecord = syncRecord => {
  const { data, ...metadata } = syncRecord;

  return {
    ...metadata,
    ...data,
  };
};

const convertToSyncRecordFromPg = pgRecord => {
  const { updatedAt, createdAt, isDeleted, ...data } = pgRecord;

  return {
    lastSynced: updatedAt?.valueOf(),
    data,
  };
};

export class PostgresWrapper {
  models = null;

  sequelize = null;

  constructor(dbOptions) {
    // init database
    const { sequelize, models } = initDatabase(dbOptions);
    this.sequelize = sequelize;
    this.models = models;
    this.channelRouter = this.buildChannelRouter();
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

  // TODO: this will need to be adapted to channels instead of types
  removeAllOfType(type) {}

  async insert(channel, syncRecord) {
    const record = convertToPgFromSyncRecord(syncRecord);
    return this.channelRouter(channel, async Model => {
      // TODO: add an autoincrementing index field
      return Model.upsert(record);
    });
  }

  async countSince(channel, since) {
    return this.channelRouter(channel, async Model => {
      return Model.count({
        where: {
          updatedAt: { [Op.gte]: since }, // TODO: gte or gt?
        },
      });
    });
  }

  async findSince(channel, since, { limit, offset } = {}) {
    return this.channelRouter(channel, async Model => {
      const records = await Model.findAll({
        limit,
        offset,
        where: {
          updatedAt: { [Op.gte]: since },
        },
      });
      return records.map(result => {
        const plainRecord = result.get({ plain: true });
        return convertToSyncRecordFromPg(plainRecord);
      });
    });
  }

  markRecordDeleted(channel, id) {
    this.channelRouter(channel, () => {});
  }
}
