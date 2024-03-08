import { Sequelize, ValidationError } from 'sequelize';
import { REFERENCE_TYPE_VALUES, SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { Model } from './Model';

export class ReferenceData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING(31),
          allowNull: false,
        },
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
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

  static initRelations(models) {
    this.belongsToMany(models.ImagingRequest, {
      through: models.ImagingRequestArea,
      as: 'area',
      foreignKey: 'areaId',
    });

    this.belongsToMany(models.ReferenceData, {
      as: 'Parent',
      through: 'reference_data_relations',
      foreignKey: 'reference_datum_id',
      otherKey: 'parent_relation_id',
    });

    this.hasOne(models.ImagingAreaExternalCode, {
      as: 'imagingAreaExternalCode',
      foreignKey: 'areaId',
    });
  }

  static async create(values) {
    // the type column is just text in sqlite so validate it here
    const { type } = values;
    if (type && !REFERENCE_TYPE_VALUES.includes(type)) {
      throw new ValidationError(`Invalid type: ${type}`);
    }
    return super.create(values);
  }

  async update(values) {
    if (values.type && values.type !== this.type) {
      throw new InvalidOperationError('The type of a reference data item cannot be changed');
    }

    return super.update(values);
  }

  static async getParent(where = {}) {
    const record = await this.findOne({
      where,
      include: 'Parent',
      through: {
        attributes: [],
      },
      raw: true,
      nest: true,
    });
    const { Parent: parent, ...rootNode } = record;
    return { rootNode, parent };
  }

  static async getParentRecursive(id, ancestors) {
    const { parent } = await this.getParent({ id });
    if (!parent.id) {
      return ancestors;
    }
    return this.getParentRecursive(parent.id, [...ancestors, parent]);
  }

  static async getAncestorsById(id) {
    const { parent, rootNode } = await this.getParent({ id });
    return this.getParentRecursive(parent.id, [rootNode, parent]);
  }

  static async getAncestorByType(type) {
    const { parent, rootNode } = await this.getParent({ type });
    const ancestors = await this.getParentRecursive(parent.id, [rootNode, parent]);
    return ancestors.map(ancestor => ancestor.type);
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
