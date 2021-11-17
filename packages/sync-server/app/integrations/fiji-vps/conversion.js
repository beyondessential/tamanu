import { Op } from 'sequelize';
import { toBase64, fromBase64 } from './base64';

export function hl7SortToTamanu(hl7Sort) {
  // hl7Sort can be quite complicated, we only support a single field `issued` in `-` order
  if (hl7Sort === '-issued') {
    return [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ];
  }
  throw new Error(`Unrecognised sort order: ${hl7Sort}`);
}

export function toSearchId({ after, ...params }) {
  const result = { ...params };
  if (after) {
    result.after = {
      createdAt: after.createdAt.toISOString(),
      id: after.id,
    };
  }
  return toBase64(result);
}

export function fromSearchId(cursor) {
  // leave it to parseQuery to validate params
  return fromBase64(cursor);
}

export function addPaginationToWhere(where, after) {
  if (!after) {
    return where;
  }
  // TODO: once we add more than a single order this will be more complicated
  return {
    [Op.and]: [
      where,
      {
        [Op.or]: [
          {
            createdAt: { [Op.lt]: after.createdAt.toISOString() },
          },
          {
            createdAt: { [Op.eq]: after.createdAt.toISOString() },
            id: { [Op.lt]: after.id },
          },
        ],
      },
    ],
  };
}
