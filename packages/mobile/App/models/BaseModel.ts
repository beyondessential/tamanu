import {
  BaseEntity,
  PrimaryColumn,
  Generated,
  UpdateDateColumn,
  CreateDateColumn,
  Column,
  BeforeUpdate,
  Index,
  MoreThan,
  FindOptionsUtils,
} from 'typeorm/browser';

export type FindMarkedForUploadOptions = {
  channel: string,
  limit?: number,
  after?: string,
};

// TODO: get rid of this once it's moved to convert.ts and I've made sure it's not used internally
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

  @Index()
  @Column({ default: true })
  markedForUpload: boolean;

  @Column({ nullable: true })
  uploadedAt: Date;

  @BeforeUpdate()
  markForUpload() {
    // TODO: go through and make sure records always use save(), not update()
    this.markedForUpload = true;
  }

  async markParentForUpload(parentModel: typeof BaseModel, property: string) {
    const value = this[property];
    const idValue = this[`${property}Id`];
    let entity: BaseModel;
    if (typeof value === 'object') {
      entity = value as BaseModel;
    } else if (typeof value === 'string') {
      entity = await parentModel.findOne({ where: { id: value } });
    } else if (typeof idValue === 'string') {
      entity = await parentModel.findOne({ where: { id: idValue } });
    }
    if (entity) {
      entity.markedForUpload = true;
      entity.save();
    } else {
      console.warn(`Failed to cascade markedForUpload from ${this.constructor.name} to ${parentModel.name} (this warning probably means some data is not uploaded to the sync server!)`);
    }
  }

  static async markUploaded(ids: string | string[], uploadedAt: Date): Promise<void> {
    await this.getRepository().update(ids, { uploadedAt, markedForUpload: false });
  }

  // TODO: compatibility with BaseEntity.create, which doesn't return a promise
  static async create<T extends BaseModel>(data?: any): Promise<T> {
    const repo = this.getRepository();

    const record = repo.create({
      ...sanitiseForImport(repo, data), // TODO: sanitise this elsewhere
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

  static async findMarkedForUpload(
    opts: FindMarkedForUploadOptions,
  ): Promise<BaseModel[]> {
    // query is built separately so it can be modified in child classes
    return this.findMarkedForUploadQuery(opts).getMany();
  }


  static findMarkedForUploadQuery(
    { limit, after }: FindMarkedForUploadOptions,
  ) {
    const whereAfter = (typeof after === 'string') ? { id: MoreThan(after) } : {};

    const qb = this.getRepository().createQueryBuilder();
    return FindOptionsUtils.applyOptionsToQueryBuilder(qb, {
      where: {
        markedForUpload: true,
        ...whereAfter,
      },
      order: {
        id: 'ASC',
      },
      take: limit,
      relations: this.includedSyncRelations,
    });
  }

  static shouldExport = false;

  // Exclude these properties from uploaded model
  // May be columns or relationIds
  static excludedSyncColumns: string[] = [
    'createdAt',
    'updatedAt',
    'markedForUpload',
    'uploadedAt',
  ];

  // Include these relations on uploaded model
  // Does not currently handle lazy or embedded relations
  static includedSyncRelations: string[] = [];
}
