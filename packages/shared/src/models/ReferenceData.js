import { Sequelize, ValidationError } from 'sequelize';
import {
  REFERENCE_TYPE_VALUES,
  DEFAULT_HIERARCHY_TYPE,
  SYNC_DIRECTIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
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

    this.belongsToMany(this, {
      as: 'parent',
      through: 'reference_data_relations',
      foreignKey: 'reference_data_id',
      otherKey: 'reference_data_parent_id',
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

  // ----------------------------------
  // Reference data hierarchy utilities
  // ----------------------------------
  static async #getParentRecursive(id, ancestors, relationType) {
    const { ReferenceData } = this.sequelize.models;
    const parent = await ReferenceData.getParent(id, relationType);
    if (!parent?.id) {
      return ancestors;
    }
    return ReferenceData.#getParentRecursive(parent.id, [...ancestors, parent]);
  }
  static async getParent(id, relationType = DEFAULT_HIERARCHY_TYPE) {
    const record = await this.findOne({
      where: { id },
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
      raw: true,
      nest: true,
    });

    return record?.parent;
  }

  async getAncestors(relationType = DEFAULT_HIERARCHY_TYPE) {
    const { ReferenceData } = this.sequelize.models;
    const baseNode = this.get({ plain: true });
    const parentNode = await ReferenceData.getParent(this.id, relationType);

    if (!parentNode) {
      return [];
    }
    return ReferenceData.#getParentRecursive(parentNode.id, [baseNode, parentNode], relationType);
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
