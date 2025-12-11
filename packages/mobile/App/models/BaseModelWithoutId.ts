import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Repository,
  UpdateDateColumn,
} from 'typeorm';
import { getSyncTick } from '../services/sync/utils';
import { ObjectType } from 'typeorm/browser/common/ObjectType';
import { FindManyOptions } from 'typeorm/browser/find-options/FindManyOptions';
import { VisibilityStatus } from '../visibilityStatuses';
import { BaseModel } from './BaseModel';

function sanitiseForImport<T>(repo: Repository<T>, data: { [key: string]: any }) {
  // TypeORM will complain when importing an object that has fields that don't
  // exist on the table in the database. We need to accommodate receiving records
  // from the central server that don't match up 100% (to allow for changes over time)
  // so we just strip those extraneous fields out here.
  //
  // Note that fields that are necessary-but-not-in-the-sync-record need to be
  // accommodated too, but that's done by making those fields nullable or
  // giving them sane defaults)

  const columns = repo.metadata.columns.map(({ propertyName }) => propertyName);
  return Object.entries(data)
    .filter(([key]) => columns.includes(key))
    .reduce(
      (state, [key, value]) => ({
        ...state,
        [key]: value,
      }),
      {},
    );
}

export abstract class BaseModelWithoutId extends BaseEntity {
  static allModels = undefined;
  static connection: DataSource | undefined = undefined;
  static useConnection(connection: DataSource): void {
    this.connection = connection;
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ nullable: false, default: -999 })
  updatedAtSyncTick: number;

  constructor() {
    super();
    const thisModel = this.constructor as typeof BaseModelWithoutId;

    if (!thisModel.syncDirection) {
      throw new Error(`syncDirection is required for model ${this.constructor.name}`);
    }
  }

  static injectAllModels(allModels: Record<string, typeof BaseModelWithoutId>): void {
    this.allModels = allModels;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async assignUpdatedAtSyncTick(): Promise<void> {
    // If setting to "-1" (i.e. "freshly synced into this device") we actually use "-999" instead.
    // That way we can tell when other fields have been updated without the updatedAtSyncTick being
    // altered (in which case this.updatedAtSyncTick will be -999, easily distinguished from -1)
    if (this.updatedAtSyncTick === -1) {
      this.updatedAtSyncTick = -999;
      return;
    }

    // In any other case, we set the updatedAtSyncTick to match the currentSyncTick
    const thisModel = this.constructor as typeof BaseModel;
    const syncTick = await getSyncTick(thisModel.allModels, 'currentSyncTick');
    this.updatedAtSyncTick = syncTick;
  }

  static findVisible<T extends BaseEntity>(
    this: ObjectType<T>,
    options?: FindManyOptions<T>,
  ): Promise<T[]> {
    const repo = this.getRepository<T>();

    if (repo.metadata.columns.find((col) => col.propertyName === 'visibilityStatus')) {
      return repo.find({
        ...options,
        where: { ...options.where, visibilityStatus: VisibilityStatus.Current },
      });
    }
    return repo.find(options);
  }

  /*
    Convenient helper for creating a new record.

    NOTES:
    - When adding relations defined with the 'RelationId' decorator,
    the data object expects the column key name (fieldName: 'some-id').
    - Relations defined with the 'IdRelation' won't work unless you use
    the same column name (fieldNameId: 'some-id'). However, it will only
    work that way on creation and not edition.
  */
  static createAndSaveOne<T extends BaseModelWithoutId>(data?: object): Promise<T> {
    const repo = this.getRepository<T>();
    return repo.create(sanitiseForImport<T>(repo, data)).save();
  }

  static syncDirection = null;

  static uploadLimit = 100;

  // Exclude these properties from uploaded model
  // May be columns or relationIds
  static excludedSyncColumns: string[] = ['createdAt', 'updatedAt', 'updatedAtSyncTick'];

  static getTableName(): string {
    return this.getRepository().metadata.tableName;
  }
}
