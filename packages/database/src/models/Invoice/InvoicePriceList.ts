import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';
import { matchesAgeIfPresent, equalsIfPresent } from './invoicePriceListMatching';

export class InvoicePriceList extends Model {
  declare id: string;
  declare code: string;
  declare name?: string;
  declare rules?: Record<string, any>;
  declare visibilityStatus: string;

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
          allowNull: true,
        },
        rules: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.InvoicePriceListItem, {
      foreignKey: 'invoicePriceListId',
      as: 'invoicePriceListItems',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  // Returns the id of the first PriceList whose rules match the provided inputs
  static async getIdForInputs(inputs: {
    patientType?: string;
    patientDOB?: string | null;
    facilityId?: string;
  }): Promise<string | null> {
    const { patientType, patientDOB, facilityId } = inputs ?? {};

    console.log('inputs', inputs);

    // Fetch visible price priceLists with rules
    // Todo: add sort order
    const priceLists = await this.findAll({
      where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      order: [
        ['createdAt', 'ASC'],
        ['code', 'ASC'],
      ],
    });

    for (const priceList of priceLists) {
      const rules = (priceList as any).rules as Record<string, any> | null | undefined;
      if (!rules || typeof rules !== 'object') {
        continue;
      }

      console.log(
        'equalsIfPresent(rules.facilityId, facilityId)',
        equalsIfPresent(rules.facilityId, facilityId),
      );
      console.log(
        'equalsIfPresent(rules.patientType, patientType)',
        equalsIfPresent(rules.patientType, patientType),
      );
      console.log(
        'matchesAgeIfPresent(rules.patientAge, patientDOB)',
        matchesAgeIfPresent(rules.patientAge, patientDOB),
      );

      const match =
        equalsIfPresent(rules.facilityId, facilityId) &&
        equalsIfPresent(rules.patientType, patientType) &&
        matchesAgeIfPresent(rules.patientAge, patientDOB);

      if (match) {
        return priceList.id;
      }
    }

    return null;
  }
}
