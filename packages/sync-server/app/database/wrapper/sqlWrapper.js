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

  async countSince(channel, since, { limit } = {}) {
    return this.sequelize.channelRouter(channel, (model, params, channelRoute) => {
      const { where, include } = channelRoute.queryFromParams(params);
      return model.count({
        paranoid: false,
        where: {
          [Op.and]: [syncCursorToWhereCondition(since), where],
        },
        include,
        limit,
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
      // email addresses are case insensitive so compare them as such
      where: Sequelize.where(
        Sequelize.fn('lower', Sequelize.col('email')),
        Sequelize.fn('lower', email),
      ),
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
