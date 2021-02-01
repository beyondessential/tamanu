import { Op, Sequelize } from 'sequelize';

function ensureNumber(input) {
  if (typeof input === 'string') {
    const parsed = parseInt(input, 10);
    return parsed; // might be NaN
  }
  return input;
}

export function upsertQuery(values) {
  // added for consistency with the other queries
  // currently just passes values and an empty options object directly through to upsert
  return [values, {}];
}

export function countSinceQuery({ since }) {
  return {
    where: {
      updatedAt: { [Op.gte]: ensureNumber(since) },
    },
    paranoid: false,
  };
}
export function findSinceQuery({ since, limit, offset }) {
  return {
    limit,
    offset,
    where: {
      updatedAt: { [Op.gte]: ensureNumber(since) },
    },
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

  async upsert(record, params) {
    await this.model.upsert(...upsertQuery(record, params));
    return 1;
  }

  async countSince(params) {
    return this.model.count(countSinceQuery(params));
  }

  async findSince(params) {
    const records = await this.model.findAll(findSinceQuery(params));
    return records.map(result => result.get({ plain: true }));
  }

  async markRecordDeleted(id) {
    // use update instead of destroy so we can change both fields
    const [num] = await this.model.update(...markDeletedQuery({ id }));
    return num;
  }
}
