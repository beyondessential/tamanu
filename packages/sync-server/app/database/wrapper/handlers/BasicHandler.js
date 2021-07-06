import { Sequelize } from 'sequelize';
import { syncCursorToWhereCondition } from 'shared/models/sync';

// added for consistency with the other queries
// currently just passes values and an empty options object directly through to upsert
export const upsertQuery = values => [values, {}];

export const countSinceQuery = ({ since }) => ({
  where: syncCursorToWhereCondition(since),
  paranoid: false,
});

export const findSinceQuery = ({ since, limit, offset }) => ({
  limit,
  offset,
  where: syncCursorToWhereCondition(since),
  order: ['updated_at', 'id'],
  paranoid: false,
});

export const markDeletedQuery = ({ id }) => [
  {
    deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
    updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
  {
    where: { id },
  },
];

export const queryWithParentIds = (params, query) => ({
  ...query,
  where: {
    ...query.where,
    ...params,
  },
});

export class BasicHandler {
  model = null;

  constructor(model) {
    if (!model) {
      throw new Error(`BasicHandler: must pass a model`);
    }
    this.model = model;
  }

  async countSince(options, params) {
    const query = queryWithParentIds(params, countSinceQuery(options));
    return this.model.count(query);
  }

  async findSince(options, params) {
    const query = queryWithParentIds(params, findSinceQuery(options));
    const records = await this.model.findAll(query);
    return records.map(result => result.get({ plain: true }));
  }

  async markRecordDeleted(id) {
    // use update instead of destroy so we can change both fields
    const [num] = await this.model.update(...markDeletedQuery({ id }));
    return num;
  }
}
