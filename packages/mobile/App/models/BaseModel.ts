import {
  BaseEntity,
  PrimaryColumn,
  Generated,
  UpdateDateColumn,
  CreateDateColumn,
  Column,
  BeforeUpdate,
} from 'typeorm/browser';

import { MoreThan } from 'typeorm';

type FindUnsyncedOptions<T> = {
  limit?: number,
  after?: T,
};

const stripId = (key) => (key === 'displayId') ? key : key.replace(/Id$/, '');

function stripIdSuffixes(data) {
  // TypeORM expects foreign key writes to be done against just the bare name
  // of the relation, rather than "relationId", but the data is all serialised
  // as "relationId" - this just strips the "Id" suffix from any fields that
  // have them. It's a bit of a blunt instrument, but, there you go.
  return Object.entries(data)
    .reduce((state, [key, value]) => ({
      ...state,
      [stripId(key)]: value,
    }), {});
}

function sanitiseForImport(repo, data) {
  // TypeORM will complain when importing an object that has fields that don't
  // exist on the table in the database. We need to accommodate receiving records
  // from the sync server that don't match up 100% (to allow for changes over time)
  // so we just strip those extraneous fields out here.
  // 
  // Note that fields that are necessary-but-not-in-the-sync-record need to be
  // accommodated too, but that's done by making those fields nullable or 
  // giving them sane defaults)

  const strippedIdsData = stripIdSuffixes(data);
  const columns = repo.metadata.columns.map(x => x.propertyName);
  return Object.entries(strippedIdsData)
    .filter(([key, value]) => columns.includes(key))
    .reduce((state, [key, value]) => ({
      ...state,
      [key]: value,
    }), {});
}

export abstract class BaseModel extends BaseEntity {
  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  markedForUpload: boolean;

  @Column({ default: 0 })
  lastUploaded: Date;

  @BeforeUpdate()
  markForUpload() {
    // TODO: go through and make sure records always use save(), not update()
    this.markedForUpload = true;
  }

  static async markUploaded(ids: string | string[], lastUploaded: Date): Promise<void> {
    await this.getRepository().update(ids, { lastUploaded, markedForUpload: false });
  }

  // TODO: compatibility with BaseEntity.create, which doesn't return a promise
  static async create<T extends BaseModel>(data?: any): Promise<T> {
    const repo = this.getRepository();

    const record = repo.create({
      ...sanitiseForImport(repo, data),
    });

    await record.save();
    return <T>record;
  }

  static async update(data: any): Promise<void> {
    const repo = this.getRepository();
    await repo.update(data.id, sanitiseForImport(repo, data));
  }

  static async createOrUpdate(data: any): Promise<void> {
    const repo = this.getRepository();
    const existing = await repo.count({ id: data.id });
    if (existing > 0) {
      await this.update(data);
      return
    }
    await this.create(data);
  }

  static async findUnsynced<T extends BaseModel>(
    { limit, after }: FindUnsyncedOptions<T> = {},
  ): Promise<T[]> {
    const repo = this.getRepository();

    // find any records that come after afterRecord
    const whereAfter = (after instanceof Object) ? { id: MoreThan(after.id) } : {};

    const record = await repo.find({
      where: {
        markedForSync: true,
        ...whereAfter,
      },
      order: {
        id: 'ASC',
      },
      take: limit,
      // TODO: add relations for nested syncing
    });
    return <T[]>record;
  }
}
