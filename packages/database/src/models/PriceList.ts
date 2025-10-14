import { DataTypes } from 'sequelize';
import { differenceInYears, parseISO } from 'date-fns';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class PriceList extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
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
          allowNull: false,
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
    this.hasMany(models.PriceListItem, {
      foreignKey: 'priceListId',
      as: 'priceListItems',
    });
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  // Returns the id of the first PriceList whose rules match the provided inputs
  // Inputs example: { patientType: 'patientType-Charity', patientDOB: '2000-08-08', facilityId: 'facility-1' }
  // Rules example: { facilityId: 'facility-1', patientAge: '<18', patientType: 'patientType-Charity' }
  static async getIdForInputs(inputs: {
    patientType?: string;
    patientDOB?: string | Date | null;
    facilityId?: string;
  }): Promise<string | null> {
    const { patientType, patientDOB, facilityId } = inputs ?? {};

    // helper to evaluate a single patientAge condition string like '<18', '>=65', '=5', '5'
    const matchesAge = (condition: any, dob?: string | Date | null): boolean => {
      if (condition == null) return true; // no constraint
      if (!dob) return false; // cannot evaluate age-based rule

      const d = typeof dob === 'string' ? parseISO(dob) : dob;
      if (!d || Number.isNaN(d.getTime())) return false;

      const ageYears = differenceInYears(new Date(), d);

      if (typeof condition === 'number') return ageYears === condition;
      if (typeof condition !== 'string') return false;
      const trimmed = condition.trim();
      const m = trimmed.match(/^(<=|>=|<|>|=)?\s*(\d{1,3})$/);
      if (!m) return false;
      const op = m[1] ?? '=';
      const val = parseInt(m[2]!, 10);
      switch (op) {
        case '<':
          return ageYears < val;
        case '<=':
          return ageYears <= val;
        case '>':
          return ageYears > val;
        case '>=':
          return ageYears >= val;
        case '=':
        default:
          return ageYears === val;
      }
    };

    const equalsIfPresent = (ruleVal: any, inputVal: any): boolean => {
      if (ruleVal == null) return true; // no constraint
      return ruleVal === inputVal;
    };

    // Fetch visible price lists with rules
    const lists = await this.findAll({
      where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      order: [
        ['createdAt', 'ASC'],
        ['code', 'ASC'],
      ],
    });

    for (const pl of lists) {
      const rules = (pl as any).rules as Record<string, any> | null | undefined;
      if (!rules || typeof rules !== 'object') continue;

      const ok =
        equalsIfPresent(rules.facilityId, facilityId) &&
        equalsIfPresent(rules.patientType, patientType) &&
        matchesAge(rules.patientAge, patientDOB);

      if (ok) return pl.id;
    }

    return null;
  }
}
