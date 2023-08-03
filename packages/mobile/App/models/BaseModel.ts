import { pick } from 'lodash';
import {
  BaseEntity,
  PrimaryColumn,
  Generated,
  UpdateDateColumn,
  CreateDateColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  Repository,
} from 'typeorm/browser';
import { getSyncTick } from '../services/sync/utils';
import { ObjectType } from 'typeorm/browser/common/ObjectType';
import { FindManyOptions } from 'typeorm/browser/find-options/FindManyOptions';
import { VisibilityStatus } from '../visibilityStatuses';

export type ModelPojo = {
  id: string;
};

// https://stackoverflow.com/questions/54281631/is-it-possible-to-get-instancetypet-to-work-on-an-abstract-class
type AbstractInstanceType<T> = T extends { prototype: infer U } ? U : never;

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
    .reduce(
      (state, [key, value]) => ({
        ...state,
        [key]: value,
      }),
      {},
    );
}

// This is used instead of @RelationId provided by typeorm, because
// typeorm's @RelationId causes a O(n^2) operation for every query to that model.
export const IdRelation = (options = {}): any => Column({ nullable: true, ...options });

/*
  This function returns a new object (shallow copied values) and does two things:
    - Rename the keys from relation fields (countryId -> country)
    - Map the value from relation fields ( 'some-id' -> { id: 'some-id' })

  When adding relation fields, we need to point to the actual relation column
  (ManyToOne, OneToOne, etc.) and use a special syntax for TypeORM.

  Since our forms/fields/suggesters only use the ID and not the whole
  object, the field names won't match the record column names.
*/
const getMappedFormValues = (values: object): object => {
  const mappedValues = {};

  // Map keys and values accordingly
  Object.entries(values).forEach(([key, value]) => {
    // Check if field is a relation (evidenced by having 'Id' at the end)
    if (key.slice(-2) === 'Id') {
      // Remove 'Id' from the key to get the actual relation column name
      const columnKey = key.slice(0, -2);

      // Save the relation as an object to let TypeORM handle it
      mappedValues[columnKey] = { id: value };
    } else {
      // Regular field, copy as is
      mappedValues[key] = value;
    }
  });

  return mappedValues;
};

export abstract class BaseModel extends BaseEntity {
  static allModels = undefined;

  @PrimaryColumn()
  @Generated('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: false, default: -999 })
  updatedAtSyncTick: number;

  constructor() {
    super();
    const thisModel = this.constructor as typeof BaseModel;

    if (!thisModel.syncDirection) {
      throw new Error(`syncDirection is required for model ${this.constructor.name}`);
    }
  }

  static injectAllModels(allModels: Record<string, typeof BaseModel>): void {
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

    if (repo.metadata.columns.find(col => col.propertyName === 'visibilityStatus')) {
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
  static createAndSaveOne<T extends BaseModel>(data?: object): Promise<T> {
    const repo = this.getRepository<T>();
    return repo.create(sanitiseForImport<T>(repo, data)).save();
  }

  /*
    Helper function to properly update TypeORM relations. The .update()
    method doesn't provide a reliable way of confirming it succeeded and
    columns specified with 'IdRelation' and 'RelationId' need special handling.
  */
  static async updateValues<T extends BaseModel>(id: string, values: object): Promise<T | null> {
    const repo = this.getRepository<T>();

    // Find the actual instance we want to update
    const instance = await repo.findOne(id);

    // Bail early if no record was found
    if (!instance) {
      console.error(
        `${this.name} record with ID ${id} doesn't exist, therefore it can't be updated`,
      );
      return null;
    }

    // Get appropiate key/value pairs to manage relations
    const mappedValues = getMappedFormValues(values);

    // Update each specified value
    Object.entries(mappedValues).forEach(([key, value]) => {
      instance[key] = value;
    });

    // Return the updated instance. NOTE: updated relations won't have
    // all fields until you reload the instance again, only their ID.
    return instance.save();
  }

  static syncDirection: string | null = null;

  static uploadLimit = 100;

  // Exclude these properties from uploaded model
  // May be columns or relationIds
  static excludedSyncColumns: string[] = ['createdAt', 'updatedAt', 'updatedAtSyncTick'];

  // Include these relations on uploaded model
  // Does not currently handle lazy or embedded relations
  static includedSyncRelations: string[] = [];

  static getTableNameForSync(): string {
    // most tables in the wider sync universe are the same as the name on mobile, but pluralised
    // specific plural handling, and a couple of other unique cases, are handled on the relevant
    // model (see Diagnosis and Medication)
    return `${this.getRepository().metadata.tableName}s`;
  }
}
