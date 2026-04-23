import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';
import {
  matchesAgeIfPresent,
  equalsIfPresent,
  matchesFacilityWithExclusionaryLogic,
} from './invoicePriceListMatching';

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
          // Older deployments stored rules as a JSON-encoded string (not an object) because
          // the importer handed Sequelize raw text and JSONB serialisation wrapped it in
          // quotes. Unwrap that on read so the matching logic sees an object either way.
          get() {
            const value = (this as InvoicePriceList).getDataValue('rules');
            if (typeof value !== 'string') return value;
            try {
              const parsed = JSON.parse(value);
              return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
            } catch {
              log.warn(
                `InvoicePriceList ${(this as InvoicePriceList).code}: rules stored as non-JSON string, ignoring. Fix by re-importing the reference data.`,
              );
              return null;
            }
          },
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
  static async getIdForPatientEncounter(encounterId: string): Promise<string | null> {
    const { models } = this.sequelize;
    const encounter = await models.Encounter.findByPk(encounterId, {
      include: [
        {
          association: 'patient',
          include: [{ association: 'additionalData' }],
        },
        'location',
      ],
    });

    if (!encounter) {
      throw new Error(`Encounter not found: ${encounterId}`);
    }

    const patientType =
      encounter.patientBillingTypeId ||
      encounter?.patient?.additionalData?.[0]?.patientBillingTypeId;
    const patientDOB = encounter?.patient?.dateOfBirth;
    const facilityId = encounter?.location?.facilityId;

    const priceLists = await this.findAll({
      where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      order: [
        ['createdAt', 'ASC'],
        ['code', 'ASC'],
      ],
    });

    // Collect all rules for exclusionary logic
    const allRules = priceLists.map(pl => pl.rules ?? {});

    const matches: Array<{ id: string; name: string }> = [];

    for (const priceList of priceLists) {
      const rules = priceList.rules ?? {};

      const match =
        matchesFacilityWithExclusionaryLogic(rules.facilityId, facilityId, allRules) &&
        equalsIfPresent(rules.patientType, patientType) &&
        matchesAgeIfPresent(rules.patientAge, patientDOB);

      if (match) {
        matches.push({ id: priceList.id, name: priceList.name || priceList.code });
      }
    }

    if (matches.length > 1) {
      log.warn(
        `Multiple price lists match the provided inputs: ${matches.map(match => match.name).join(', ')}`,
      );
    }

    // Returns null if no matches are found
    return matches[0] ? matches[0].id : null;
  }
}
