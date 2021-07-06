import { Sequelize, Op } from 'sequelize';
import { initDatabase } from 'shared/services/database';
import { syncCursorToWhereCondition } from 'shared/models/sync';

export class SqlWrapper {
  models = null;

  sequelize = null;

  constructor(dbOptions) {
    // init database
    this._dbPromise = initDatabase({
      ...dbOptions,
      hackToSkipEncounterValidation: true, // TODO: remove once mobile implements all relationships
    });
  }

  async init() {
    const { sequelize, models } = await this._dbPromise;
    this.sequelize = sequelize;
    this.models = models;
    return this;
  }

  async close() {
    await this.sequelize.close();
  }

  async countSince(channel, since) {
    return this.sequelize.channelRouter(channel, (model, params) => {
      return model.count({
        paranoid: false,
        where: {
          [Op.and]: [syncCursorToWhereCondition(since), params],
        },
      });
    });
  }

  async markRecordDeleted(channel, id) {
    return this.sequelize.channelRouter(channel, async model => {
      // use update instead of destroy so we can change both fields
      const [num] = await model.update(
        {
          deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
          updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        {
          where: { id },
        },
      );
      return num;
    });
  }
  //------------------------------------
  // required for auth middleware

  async findUser(email) {
    const user = await this.models.User.scope('withPassword').findOne({
      where: { email },
    });
    if (!user) {
      return null;
    }
    return user.get({ plain: true });
  }

  async findUserById(id) {
    const user = await this.models.User.findByPk(id);
    if (!user) {
      return null;
    }
    return user.get({ plain: true });
  }
}
