/* eslint-disable no-unused-vars */
import {
  Op,
  Utils,
  DataTypes,
  Model as BaseModel,
  type ModelAttributes,
  Sequelize,
} from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { genericBeforeDestroy, genericBeforeBulkDestroy } from '../utils/beforeDestroyHooks';
import type { InitOptions, Models } from '../types/model';
import type { SyncHookSnapshotChanges, ModelSanitizeArgs, SessionConfig, SyncSnapshotAttributes } from '../types/sync';

const firstLetterLowercase = (s: string) => (s[0] || '').toLowerCase() + s.slice(1);

export class Model<
  TModelAttributes extends Record<string, any> = any,
  _TCreationAttributes extends {} = TModelAttributes,
> extends BaseModel<TModelAttributes, _TCreationAttributes> {
  declare id: any;
  declare createdAt: Date;
  declare updatedAt?: Date;
  declare deletedAt?: Date;
  declare sequelize: { models: Models } & Omit<Sequelize, 'models'>;
  declare static sequelize: { models: Models } & Omit<Sequelize, 'models'>;
  declare static syncDirection: InitOptions['syncDirection'];
  declare static defaultIdValue?: string | number;
  declare static usesPublicSchema: boolean;
  declare static name: string;
  declare static buildSyncFilter: () => string | null;
  declare static buildPatientSyncFilter: (
    _patientCount: number,
    _markedForSyncPatientsTable: string,
    _sessionConfig: SessionConfig,
  ) => string | null;
  declare static adjustDataPostSyncPush?: (ids: string[]) => Promise<void>;
  declare static incomingSyncHook?: (changes: SyncSnapshotAttributes[]) => Promise<SyncHookSnapshotChanges | undefined>;

  static init(
    modelAttributes: ModelAttributes,
    { syncDirection, timestamps = true, schema, ...options }: Omit<InitOptions, 'primaryKey'>,
  ) {
    // this is used in our database init code to make it easier to create models,
    // but shouldn't be passed down to sequelize. instead of forcing every model
    // to erase it even if they don't use it, we delete it here
    if ('primaryKey' in options) {
      delete options.primaryKey;
    }

    const attributes = {
      ...modelAttributes,
    };
    const usesPublicSchema = schema === undefined || schema === 'public';
    if (syncDirection !== SYNC_DIRECTIONS.DO_NOT_SYNC) {
      attributes.updatedAtSyncTick = DataTypes.BIGINT;
    }
    super.init(attributes, {
      timestamps,
      schema,
      ...options,
      hooks: {
        ...options.hooks,
        ...(usesPublicSchema && {
          beforeDestroy: genericBeforeDestroy,
          beforeBulkDestroy: genericBeforeBulkDestroy,
        }),
      },
    });
    this.defaultIdValue =
      typeof attributes.id === 'object' && 'defaultValue' in attributes.id
        ? (attributes.id.defaultValue as string | number)
        : undefined;
    if (!syncDirection) {
      throw new Error(
        `Every model must specify a sync direction, even if that is "DO_NOT_SYNC". Check the model definition for ${this.name}`,
      );
    }
    this.syncDirection = syncDirection;
    this.validateSync(timestamps);
    this.usesPublicSchema = usesPublicSchema;

    return this as any;
  }

  static generateId() {
    return Utils.toDefaultValue(this.defaultIdValue);
  }

  /**
   * Generates a uuid via the database
   */
  static async generateDbUuid() {
    const result: any  = await this.sequelize.query(`SELECT gen_random_uuid();`);
    return result[0][0].gen_random_uuid;
  }

  static validateSync(timestamps: boolean) {
    // every syncing model should have timestamps turned on
    if (!timestamps && this.syncDirection !== SYNC_DIRECTIONS.DO_NOT_SYNC) {
      throw new Error(
        'DEV: syncing models should all have createdAt, updatedAt, deletedAt, and updatedAtSyncTick timestamps turned on',
      );
    }

    // every model that syncs from central to facilities (i.e. PULL_FROM_CENTRAL or BIDRIRECTIONAL
    // sync direction) must implement either buildSyncFilter or buildPatientSyncFilter, to make sure
    // it is considered
    // models that sync all records to all facilities (i.e. don't need a sync filter) should
    // implement buildSyncFilter by returning null
    if (
      [SYNC_DIRECTIONS.BIDIRECTIONAL, SYNC_DIRECTIONS.PULL_FROM_CENTRAL].includes(
        this.syncDirection,
      ) &&
      !this.buildSyncFilter &&
      !this.buildPatientSyncFilter
    ) {
      throw new Error(
        `DEV: ${this.name} syncs from central to facility, and must implement either buildSyncFilter or buildPatientSyncFilter. If it syncs everywhere, simply implement buildSyncFilter and return null.`,
      );
    }
  }

  forResponse() {
    // Reassign reference associations to use camelCase & dataValues.
    // That is, it turns
    // { id: 12345, field: 'value', ReferenceObject: [model instance] }
    // into
    // { id: 12345, field: 'value', referenceObject: { id: 23456, name: 'object' } }

    const models = this.sequelize.models;
    const values = Object.entries(this.dataValues)
      .filter(([, val]) => val !== null)
      .reduce(
        (obj, [key, val]) => ({
          ...obj,
          [key]: val,
        }),
        {},
      );

    const references = (this.constructor as typeof Model).getListReferenceAssociations(models);

    if (!references) return values;

    // Note that we don't call forResponse on the nested object, this is under the assumption that
    // if the structure of a nested object differs significantly from its database representation,
    // it's probably more correct to implement that as a separate endpoint rather than putting the
    // logic here.
    return references.reduce((allValues: Record<string, any>, referenceName: string) => {
      const { [referenceName]: referenceVal, ...otherValues } = allValues;
      if (!referenceVal) return allValues;
      return {
        ...otherValues,
        [firstLetterLowercase(referenceName)]: referenceVal.dataValues,
      };
    }, values);
  }

  toJSON() {
    return this.forResponse();
  }

  getModelName() {
    return this.constructor.name;
  }

  static getListReferenceAssociations(_models?: Models): any | undefined {
    // List of relations to include when fetching this model
    // as part of a list (eg to display in a table)
    //
    // This will get used in an options object passed to a sequelize
    // query, so returning 'undefined' by default here just leaves that key
    // empty (which is the desired behaviour).
    return undefined;
  }

  static getFullReferenceAssociations() {
    // List of relations when fetching just this model
    // (eg to display in a detailed view)
    const { models } = this.sequelize!;
    return this.getListReferenceAssociations(models);
  }

  static async findByIds(ids: unknown[], paranoid = true) {
    if (ids.length === 0) return [];

    return this.findAll<Model>({
      where: {
        id: { [Op.in]: ids },
      },
      paranoid,
    });
  }

  static sanitizeForCentralServer(values: ModelSanitizeArgs) {
    // implement on the specific model if needed
    return values;
  }

  static sanitizeForFacilityServer(values: object) {
    // implement on the specific model if needed
    return values;
  }
}
