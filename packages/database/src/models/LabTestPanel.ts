import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class LabTestPanel extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
  declare visibilityStatus: string;
  declare availableFacilities: string[] | null;
  declare externalCode?: string;
  declare categoryId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.STRING,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
        availableFacilities: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: null,
        },
        externalCode: DataTypes.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static getListReferenceAssociations() {
    return ['category'];
  }

  static initRelations(models: Models) {
    this.belongsToMany(models.LabTestType, {
      through: models.LabTestPanelLabTestTypes,
      as: 'labTestTypes',
      foreignKey: 'labTestPanelId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'categoryId',
      as: 'category',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  /**
   * Generates a Sequelize literal condition to filter out lab test panels
   * where any member test type is not visible in the specified facility.
   *
   * @param facilityId - The facility ID to check visibility against
   * @param db - The Sequelize instance for escaping values
   * @returns A Sequelize.literal condition for filtering panels
   */
  static getMemberVisibilityFilter(facilityId: string, db: any) {
    const Sequelize = db.Sequelize || require('sequelize');
    const escapedFacilityArray = db.escape(JSON.stringify([facilityId]));
    return Sequelize.literal(`
      "LabTestPanel"."id" NOT IN (
        SELECT DISTINCT lptlt.lab_test_panel_id
        FROM lab_test_panel_lab_test_types lptlt
        INNER JOIN lab_test_types ltt
          ON ltt.id = lptlt.lab_test_type_id
        WHERE lptlt.deleted_at IS NULL
          AND ltt.available_facilities IS NOT NULL
          AND NOT (ltt.available_facilities @> ${escapedFacilityArray}::jsonb)
      )
    `);
  }
}
