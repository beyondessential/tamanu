import type { Attributes, Model, ModelStatic, WhereOptions } from 'sequelize';

import { chance } from '../fake/index.js';

// A deployment holds a bounded set of the rows generated here, not one per data round,
// and the seed top-up runs again on every image bump. Once a pool is full a round reuses
// a row rather than minting another; a model with no rows yet is always created, which is
// what puts a type added in this version onto a database seeded before it existed.
export const POOL_SIZE = 50;

export interface PoolOptions<M extends Model> {
  size?: number;
  // Whatever the factory pins on the row belongs here too: a filter that asks less than
  // the factory sets returns a row the caller's other picks do not agree with.
  where?: WhereOptions<Attributes<M>>;
}

export const pooled = async <M extends Model>(
  model: ModelStatic<M>,
  create: () => Promise<M>,
  { size = POOL_SIZE, where }: PoolOptions<M> = {},
): Promise<M> => {
  const rows = await model.findAll({ where, limit: size });
  if (rows.length < size) return create();
  return chance.pickone(rows);
};

// A parent that is unusable without a child: a report definition with no version cannot be
// listed, a survey with no screen component has nothing to answer. The child is created with
// the parent so a new one is never left unusable, and pooled on its own so a round still adds
// one once the parent pool is full.
export const pooledWithChild = async <P extends Model & { id: string }, C extends Model>(
  parent: ModelStatic<P>,
  createParent: () => Promise<P>,
  child: ModelStatic<C>,
  createChild: (parentId: string) => Promise<C>,
  options: PoolOptions<P> = {},
): Promise<P> => {
  const row = await pooled(
    parent,
    async () => {
      const created = await createParent();
      await createChild(created.id);
      return created;
    },
    options,
  );
  await pooled(child, () => createChild(row.id));
  return row;
};
