import { pick } from 'lodash';
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
  Repository,
} from 'typeorm/browser';

export type ModelPojo = {
  id: string;
};

export type FindMarkedForUploadOptions = {
  channel: string;
  limit?: number;
  after?: string;
};

function sanitiseForImport<T>(repo: Repository<T>, data: { [key: string]: any }) {
  // TypeORM will complain when importing an object that has fields that don't
  // exist on the table in the database. We need to accommodate receiving records
  // from the sync server that don't match up 100% (to allow for changes over time)
  // so we just strip those extraneous fields out here.
  //
  // Note that fields that are necessary-but-not-in-the-sync-record need to be
  // accommodated too, but that's done by making those fields nullable or
  // giving them sane defaults)

  const columns = repo.metadata.columns.map(({ propertyName }) => propertyName);
  return Object.entries(data)
    .filter(([key]) => columns.includes(key))
    .reduce((state, [key, value]) => ({
      ...state,
      [key]: value,
    }), {});
}

// This is used instead of @RelationId provided by typeorm, because
// typeorm's @RelationId causes a O(n^2) operation for every query to that model.
export const IdRelation = (options = {}): any => Column({ nullable: true, ...options });

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
    this.markedForUpload = true;
  }

  async markParent(
    parentModel: typeof BaseModel,
    parentProperty: string,
    flag: 'markedForUpload' | 'markedForSync',
  ) {
    let entity: BaseModel;
    const parentValue = this[parentProperty];
    if (typeof parentValue === 'string') {
      entity = await parentModel.findOne({ where: { id: parentValue } })
    } else if (typeof parentValue === 'object') {
      entity = await parentModel.findOne({ where: { id: parentValue.id } })
    } else {
      const thisModel = this.constructor as typeof BaseModel;
      entity = await thisModel
        .getRepository()
        .createQueryBuilder()
        .relation(thisModel, parentProperty)
        .of(this)
        .loadOne();
    }
    if (!entity) {
      return;
    }
    entity[flag] = true;
    await entity.save();
  }

  static async markUploaded(
    ids: string | string[],
    uploadedAt: Date,
    repository: Repository<BaseModel>,
  ): Promise<void> {
    await repository.update(ids, { uploadedAt, markedForUpload: false });
  }

  static createAndSaveOne<T extends BaseModel>(data?: object): Promise<T> {
    const repo = this.getRepository<T>();
    return repo.create(sanitiseForImport<T>(repo, data)).save();
  }

  static async findMarkedForUpload(
    opts: FindMarkedForUploadOptions,
    repository: Repository<BaseModel> = this.getRepository(),
  ): Promise<BaseModel[]> {
    // query is built separately so it can be modified in child classes
    return this.findMarkedForUploadQuery(opts, repository).getMany() as Promise<BaseModel[]>;
  }

  static findMarkedForUploadQuery(
    { limit, after }: FindMarkedForUploadOptions,
    repository: Repository<BaseModel>,
  ) {
    const whereAfter = (typeof after === 'string') ? { id: MoreThan(after) } : {};

    const qb = repository.createQueryBuilder();
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

  static async filterExportRecords(ids: string[]) {
    return ids;
  }

  static async postExportCleanUp() { }

  static shouldImport = true;

  static shouldExport = false;

  static uploadLimit = 100;

  // Exclude these properties from uploaded model
  // May be columns or relationIds
  static excludedSyncColumns: string[] = [
    'createdAt',
    'updatedAt',
    'markedForUpload',
    'markedForSync',
    'uploadedAt',
  ];

  // Include these relations on uploaded model
  // Does not currently handle lazy or embedded relations
  static includedSyncRelations: string[] = [];

  getPlainData(): ModelPojo {
    const thisModel = this.constructor as typeof BaseModel;
    const repo = thisModel.getRepository();
    const { metadata } = repo;
    const allColumns = [
      ...metadata.columns,
      ...metadata.relationIds, // typeorm thinks these aren't columns
    ].map(({ propertyName }) => propertyName);
    return pick(this, allColumns) as ModelPojo;
  }
}
