import { Sequelize } from 'sequelize';
import { syncCursorToWhereCondition } from 'shared/models/sync';

// TODO: rework to use channelRoutes instead of parentId

export function upsertQuery(values) {
  // added for consistency with the other queries
  // currently just passes values and an empty options object directly through to upsert
  return [values, {}];
}

export function countSinceQuery({ since }) {
  return {
    where: syncCursorToWhereCondition(since),
    paranoid: false,
  };
}

export function findSinceQuery({ since, limit, offset }) {
  return {
    limit,
    offset,
    where: syncCursorToWhereCondition(since),
    order: ['updated_at', 'id'],
    paranoid: false,
  };
}

export function markDeletedQuery({ id }) {
  return [
    {
      deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
      updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: { id },
    },
  ];
}

export class BasicHandler {
  model = null;

  constructor(model) {
    if (!model) {
      throw new Error(`BasicHandler: must pass a model`);
    }
    this.model = model;
  }

  // ONLY FOR TESTS, ignores "paranoid"'s soft deletion
  async unsafeRemoveAll() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('DO NOT use unsafeRemoveAllOfChannel outside tests!');
    }
    return this.model.destroy({ truncate: true, cascade: true, force: true });
  }

  async upsert(record, params, channel) {
    const [values, options] = upsertQuery(record, params);

    // TODO: get rid of upsert so we don't duplicate funtionality between here and import
    if (this.model.syncParentIdKey) {
      const parentId = this.model.syncParentIdFromChannel(channel);
      if (!parentId) {
        throw new Error(
          `Must provide parentId for models like ${this.model.name} with syncParentIdKey set`,
        );
      }
      const existing = values[this.model.syncParentIdKey];
      if (existing && existing !== parentId) {
        throw new Error(
          `Tried to insert record with ${this.model.syncParentIdKey} ${existing} to channel with ${this.model.syncParentIdKey} ${parentId}`,
        );
      }
      values[this.model.syncParentIdKey] = parentId;
    }

    await this.model.upsert(values, options);
    return 1;
  }

  async countSince(params, channel) {
    const query = this.queryWithParentId(channel, countSinceQuery(params));
    return this.model.count(query);
  }

  async findSince(params, channel) {
    const query = this.queryWithParentId(channel, findSinceQuery(params));
    const records = await this.model.findAll(query);
    return records.map(result => result.get({ plain: true }));
  }

  async markRecordDeleted(id) {
    // use update instead of destroy so we can change both fields
    const [num] = await this.model.update(...markDeletedQuery({ id }));
    return num;
  }

  queryWithParentId(channel, query) {
    if (!this.model.syncParentIdKey) {
      return query;
    }

    const parentId = this.model.syncParentIdFromChannel(channel);
    if (!parentId) {
      throw new Error(
        `Must provide parentId for models like ${this.model.name} with syncParentIdKey set`,
      );
    }
    return {
      ...query,
      where: {
        ...query.where,
        [this.model.syncParentIdKey]: parentId,
      },
    };
  }
}
