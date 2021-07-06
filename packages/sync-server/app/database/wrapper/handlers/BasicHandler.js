import { Sequelize } from 'sequelize';
import { syncCursorToWhereCondition, assertParentIdsMatch } from 'shared/models/sync';

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

export const queryWithParentIds = (parentIds, query) => ({
  ...query,
  where: {
    ...query.where,
    ...parentIds,
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

  async upsert(record, parentIds) {
    // TODO: get rid of upsert so we don't duplicate funtionality between here and import
    assertParentIdsMatch(record, parentIds);
    const [values, options] = upsertQuery(record);
    await this.model.upsert(values, options);
    return 1;
  }

  async countSince(params, parentIds) {
    const query = queryWithParentIds(parentIds, countSinceQuery(params));
    return this.model.count(query);
  }

  async findSince(params, parentIds) {
    const query = queryWithParentIds(parentIds, findSinceQuery(params));
    const records = await this.model.findAll(query);
    return records.map(result => result.get({ plain: true }));
  }

  async markRecordDeleted(id) {
    // use update instead of destroy so we can change both fields
    const [num] = await this.model.update(...markDeletedQuery({ id }));
    return num;
  }
}
