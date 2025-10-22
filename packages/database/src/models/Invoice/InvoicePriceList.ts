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
          allowNull: false,
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

  // Returns the id of the PriceList whose rules match the provided inputs
  // Throws an error if more than one match is found
  static async getIdForPatientEncounter(inputs: {
    patientType?: string;
    patientDOB?: string | null;
    facilityId?: string;
  }): Promise<string | null> {
    const { patientType, patientDOB, facilityId } = inputs ?? {};

    const priceLists = await this.findAll({
      where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      order: [
        ['createdAt', 'ASC'],
        ['code', 'ASC'],
      ],
    });

    const matches: string[] = [];

    for (const priceList of priceLists) {
      const rules = (priceList as any).rules as Record<string, any> | null | undefined;
      if (!rules || typeof rules !== 'object') {
        continue;
      }

      const match =
        equalsIfPresent(rules.facilityId, facilityId) &&
        equalsIfPresent(rules.patientType, patientType) &&
        matchesAgeIfPresent(rules.patientAge, patientDOB);

      if (match) {
        matches.push(priceList.id);
      }
    }

    if (matches.length > 1) {
      throw new Error(`Multiple price lists match the provided inputs: ${matches.join(', ')}`);
    }

    // Returns null if no matches are found
    return matches[0] ?? null;
  }
}
