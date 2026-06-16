import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { Model } from '../Model.ts';
import type { InitOptions, Models } from '../../types/model.ts';
import {
  matchesAgeIfPresent,
  equalsIfPresent,
  matchesFacilityWithExclusionaryLogic,
} from './invoicePriceListMatching.ts';

export class InvoicePriceList extends Model {
  declare id: string;
  declare code: string;
  declare name?: string;
  declare rules?: Record<string, any>;
  declare evaluationOrder?: number;
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
        evaluationOrder: {
          type: DataTypes.INTEGER,
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
      // When multiple price lists match an encounter, the first one wins. evaluationOrder
      // lets admins set that priority explicitly (lowest number wins) so overlapping rules
      // resolve the same way in every environment. Postgres sorts ASC nulls last, so lists
      // without an evaluationOrder fall back to createdAt/code after any that have one.
      order: [
        ['evaluationOrder', 'ASC'],
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
