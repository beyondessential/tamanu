import { Sequelize } from 'sequelize';
import { syncCursorToWhereCondition } from 'shared/models/sync';

export const countSinceQuery = ({ since }) => ({
  where: syncCursorToWhereCondition(since),
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

  async markRecordDeleted(id) {
    // use update instead of destroy so we can change both fields
    const [num] = await this.model.update(...markDeletedQuery({ id }));
    return num;
  }
}
