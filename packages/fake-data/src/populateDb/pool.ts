import { chance } from '../fake/index.js';

// A deployment holds a bounded set of the rows generated here, not one per data round,
// and the seed top-up runs again on every image bump. Once a pool is full a round reuses
// a row rather than minting another; a model with no rows yet is always created, which is
// what puts a type added in this version onto a database seeded before it existed.
export const POOL_SIZE = 50;

export const pooled = async <T>(
  model: { findAll: Function; findByPk: Function },
  create: () => Promise<T>,
  size: number = POOL_SIZE,
  where?: Record<string, unknown>,
): Promise<T> => {
  const ids = (await model.findAll({ where, attributes: ['id'], raw: true })).map(
    (row: { id: string }) => row.id,
  );
  if (ids.length < size) return create();
  return (await model.findByPk(chance.pickone(ids)))! as T;
};
