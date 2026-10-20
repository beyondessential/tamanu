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
  const ids = (await model.findAll({
    where,
    attributes: ['id'],
    raw: true,
    limit: size,
  })) as unknown as Array<{ id: string }>;
  if (ids.length < size) return create();
  return (await model.findByPk(chance.pickone(ids).id)) as M;
};

export interface ChildPoolOptions<P extends Model, C extends Model> extends PoolOptions<P> {
  // The child's foreign key to its parent. Without it the child pool counts every child
  // row in the database, so one full parent's children stop any other parent gaining one.
  childKey: string & keyof Attributes<C>;
}

// A parent that is unusable without a child: a report definition with no version cannot be
// listed, a survey with no screen component has nothing to answer. The child is created with
// the parent so a new one is never left unusable, and pooled on its own so a round still adds
// one once the parent pool is full.
export const pooledWithChild = async <P extends Model & { id: string }, C extends Model>(
  parent: ModelStatic<P>,
  createParent: () => Promise<P>,
  child: ModelStatic<C>,
  createChild: (parentId: string) => Promise<C>,
  { childKey, ...options }: ChildPoolOptions<P, C>,
): Promise<P> => {
  let minted = false;
  const row = await pooled(
    parent,
    async () => {
      minted = true;
      const created = await createParent();
      await createChild(created.id);
      return created;
    },
    options,
  );
  if (minted) return row;

  await pooled(child, () => createChild(row.id), {
    where: { [childKey]: row.id } as WhereOptions<Attributes<C>>,
  });
  return row;
};
