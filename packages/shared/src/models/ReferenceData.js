import { Sequelize, ValidationError } from 'sequelize';
import { REFERENCE_TYPE_VALUES, SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { Model } from './Model';
import { ReferenceDataRelation } from '../models';

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

    this.hasMany(models.ReferenceDataRelation, {
      as: 'ChildRelations',
      foreignKey: 'childId',
    });

    this.hasMany(models.ReferenceDataRelation, {
      as: 'ParentRelations',
      foreignKey: 'parentId',
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

  static getChildrenByParentId(parentId) {
    return this.findAll({
      raw: true,
      where: { '$ChildRelations.parent_id$': parentId },
      include: {
        model: ReferenceDataRelation,
        as: 'ChildRelations',
        attributes: [],
      },
    });
  }

  static async getChildrenRecursive(id, node) {
    const children = await this.getChildrenByParentId(id);

    if (children.length === 0) {
      // leaf node
      return node;
    }

    node.children = await Promise.all(
      children.map(child => this.getChildrenRecursive(child.id, child)),
    );

    // internal node
    return node;
  }

  static async getParentById(id) {
    const records = await this.findAll({
      raw: true,
      where: { '$ParentRelations.child_id$': id },
      include: {
        model: ReferenceDataRelation,
        as: 'ParentRelations',
      },
    });
    return records.length > 0 ? records[0] : null;
  }

  static async getParentRecursive(id, ancestors) {
    const parent = await this.getParentById(id);
    if (!parent) {
      return ancestors;
    }
    return this.getParentRecursive(parent['ParentRelations.parentId'], [...ancestors, parent]);
  }

  static async getDescendantsByParentId(parentId) {
    const rootNode = await this.findByPk(parentId, { raw: true });
    return this.getChildrenRecursive(parentId, rootNode);
  }

  static async getAncestorsById(id) {
    const rootNode = await this.getParentById(id);
    return this.getParentRecursive(rootNode['ParentRelations.parentId'], [rootNode]);
  }

  static async getAddressHierarchyByType(type) {
    const entitiesOfType = await this.findAll({
      raw: true,
      where: { type: type, '$ChildRelations.type$': 'ADDRESS_HIERARCHY' },
      include: [
        {
          model: ReferenceDataRelation,
          as: 'ChildRelations',
          attributes: [],
        },
      ],
    });

    return Promise.all(entitiesOfType.map(child => this.getChildrenRecursive(child.id, child)));
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
