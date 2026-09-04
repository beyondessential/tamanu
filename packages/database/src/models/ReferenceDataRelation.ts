import { Op, Sequelize, DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

const REFERENCE_DATA_RELATION_TYPE_VALUES = Object.values(REFERENCE_DATA_RELATION_TYPES);

export class ReferenceDataRelation extends Model {
  declare id: string;
  declare referenceDataId?: string;
  declare referenceDataParentId?: string;
  declare type: (typeof REFERENCE_DATA_RELATION_TYPE_VALUES)[number];

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        type: {
          type: DataTypes.ENUM(...REFERENCE_DATA_RELATION_TYPE_VALUES),
          defaultValue: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
        },
        referenceDataParentId: {
          type: DataTypes.TEXT,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        referenceDataId: {
          type: DataTypes.TEXT,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referenceDataId',
      as: 'referenceData',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referenceDataParentId',
      as: 'referenceDataParent',
    });
  }

  // Map each parent id to its single related child ({ id, name }) for a relation type. Assumes at
  // most one child per parent for that type (e.g. a lab test category's default specimen type); if
  // several exist, the first is kept. Centralises the read behind the (parent_id, type) index.
  static async getSingleChildByParentIds(
    parentIds: string[],
    type: string,
  ): Promise<Map<string, { id: string; name: string | null }>> {
    const byParentId = new Map<string, { id: string; name: string | null }>();
    if (parentIds.length === 0) return byParentId;

    const relations = await this.findAll({
      attributes: ['referenceDataParentId', 'referenceDataId'],
      where: { type, referenceDataParentId: { [Op.in]: parentIds } },
      include: [{ association: 'referenceData', attributes: ['id', 'name'] }],
    });
    for (const relation of relations) {
      if (byParentId.has(relation.referenceDataParentId!)) continue;
      byParentId.set(relation.referenceDataParentId!, {
        id: relation.referenceDataId!,
        name: (relation as any).referenceData?.name ?? null,
      });
    }
    return byParentId;
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
