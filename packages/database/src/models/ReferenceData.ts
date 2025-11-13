import { DataTypes, ValidationError } from 'sequelize';
import { REFERENCE_TYPE_VALUES, SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ReferenceData extends Model {
  declare id: string;
  declare code: string;
  declare type: string;
  declare name: string;
  declare visibilityStatus: string;
  declare systemRequired: boolean;
  declare parent?: ReferenceData;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING(31),
          allowNull: false,
        },
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        systemRequired: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        indexes: [
          {
            unique: false,
            fields: ['type'],
          },
          {
            unique: false,
            name: 'code_by_type',
            fields: ['code', 'type'],
          },
        ],
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsToMany(models.Encounter, {
      through: models.EncounterDiet,
      as: 'diet',
      foreignKey: 'dietId',
    });

    this.belongsToMany(models.ImagingRequest, {
      through: models.ImagingRequestArea,
      as: 'area',
      foreignKey: 'areaId',
    });

    this.belongsToMany(models.Task, {
      through: models.TaskDesignation,
      as: 'tasks',
      foreignKey: 'designationId',
    });

    this.belongsToMany(models.User, {
      through: models.UserDesignation,
      as: 'designationUsers',
      foreignKey: 'designationId',
    });

    this.belongsToMany(models.Survey, {
      through: models.ProcedureTypeSurvey,
      as: 'surveys',
      foreignKey: 'procedureTypeId',
    });

    this.belongsToMany(this, {
      as: 'parent',
      through: 'reference_data_relations',
      foreignKey: 'referenceDataId',
      otherKey: 'referenceDataParentId',
    });

    this.belongsToMany(this, {
      as: 'children',
      through: 'reference_data_relations',
      foreignKey: 'referenceDataParentId',
      otherKey: 'referenceDataId',
    });

    this.hasOne(models.ImagingAreaExternalCode, {
      as: 'imagingAreaExternalCode',
      foreignKey: 'areaId',
    });

    this.hasOne(models.Facility, {
      as: 'facility',
      foreignKey: 'catchmentId',
    });

    this.hasOne(models.TaskTemplate, {
      as: 'taskTemplate',
      foreignKey: 'referenceDataId',
    });

    this.hasOne(models.ReferenceDrug, {
      as: 'referenceDrug',
      foreignKey: 'referenceDataId',
    });

    this.hasOne(models.ReferenceMedicationTemplate, {
      as: 'medicationTemplate',
      foreignKey: 'referenceDataId',
    });
  }

  static async create(values: any): Promise<any> {
    // the type column is just text in sqlite so validate it here
    const { type } = values;
    if (type && !REFERENCE_TYPE_VALUES.includes(type)) {
      throw new ValidationError(`Invalid type: ${type}`, []);
    }
    return super.create(values);
  }

  async update(values: any): Promise<any> {
    if (values.type && values.type !== this.type) {
      throw new InvalidOperationError('The type of a reference data item cannot be changed');
    }

    return super.update(values);
  }

  // ----------------------------------
  // Reference data hierarchy utilities
  // ----------------------------------
  static async #getParentRecursive(
    id: string,
    ancestors: ReferenceData[],
    relationType: string,
  ): Promise<ReferenceData[]> {
    const { ReferenceData } = this.sequelize.models;
    const parent = await ReferenceData.getParent(id, relationType);
    if (!parent?.id) {
      return ancestors;
    }
    return ReferenceData.#getParentRecursive(parent.id, [parent, ...ancestors], relationType);
  }

  static async getParent(id: string, relationType: string) {
    const record = await this.getNode({ where: { id }, relationType });
    return record?.parent;
  }

  // Gets a node in the hierarchy including the parent record
  static async getNode({
    where,
    raw = true,
    relationType,
  }: {
    where: Record<string, any>;
    raw?: boolean;
    relationType: string;
  }) {
    return this.findOne({
      where,
      include: {
        model: this,
        as: 'parent',
        required: true,
        through: {
          attributes: [],
          where: {
            type: relationType,
          },
        },
      },
      raw,
      nest: true,
    });
  }

  async getAncestors(relationType: string) {
    const { ReferenceData } = this.sequelize.models;
    const parentNode = await ReferenceData.getParent(this.id, relationType);

    if (!parentNode) {
      return [];
    }

    return ReferenceData.#getParentRecursive(parentNode.id, [parentNode], relationType);
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
