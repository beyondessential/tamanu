import { DataTypes, Op } from 'sequelize';
import { REFERENCE_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class ReferenceDrug extends Model {
  declare id: string;
  declare referenceDataId: string;
  declare route?: string;
  declare units?: string;
  declare notes?: string;
  declare isSensitive: boolean;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        referenceDataId: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          references: {
            model: 'referenceData',
            key: 'id',
          },
        },
        route: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        units: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        notes: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isSensitive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referenceDataId',
      as: 'referenceData',
    });
    this.hasMany(models.ReferenceDrugFacility, {
      foreignKey: 'referenceDrugId',
      as: 'facilities',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  static getFullReferenceAssociations() {
    return ['referenceData'];
  }

  /**
   * Check if any medications in the given list are sensitive
   * @param medicationIds - Array of medication IDs to check
   * @returns Promise<boolean> - True if any medication is sensitive, false otherwise
   */
  static async hasSensitiveMedication(medicationIds: string[]): Promise<boolean> {
    if (!medicationIds || medicationIds.length === 0) {
      return false;
    }

    const { ReferenceData } = this.sequelize.models;
    const sensitiveMedication = await ReferenceData.findOne({
      where: {
        id: { [Op.in]: medicationIds },
        type: REFERENCE_TYPES.DRUG,
      },
      include: {
        model: this,
        as: 'referenceDrug',
        attributes: ['isSensitive'],
        where: { isSensitive: true },
        required: true,
      },
      attributes: ['id'],
    });

    return !!sensitiveMedication;
  }
}
