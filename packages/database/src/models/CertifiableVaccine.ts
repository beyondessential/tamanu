import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class CertifiableVaccine extends Model {
  declare id: string;
  declare icd11DrugCode: string;
  declare icd11DiseaseCode: string;
  declare vaccineCode: string;
  declare targetCode?: string;
  declare euProductCode?: string;
  declare maximumDosage: number;
  declare vaccineId?: string;
  declare manufacturerId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        // ICD11 code for the vaccine type
        icd11DrugCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        // ICD11 code for the targeted disease
        icd11DiseaseCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        // SNOMED CT or ATC code for the vaccine type
        vaccineCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        // SNOMED CT or ATC code for targeted disease
        targetCode: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        // EU authorisation code for the vaccine product
        euProductCode: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        maximumDosage: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      {
        ...options,
        // This is essentially reference/imported data
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        validate: {
          mustHaveVaccine() {
            if (!this.deletedAt && !this.vaccineId) {
              throw new InvalidOperationError('A certifiable vaccine must have a vaccine.');
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['encounter', 'scheduledVaccine'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'vaccineId',
      as: 'vaccine',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'manufacturerId',
      as: 'manufacturer',
    });
  }

  static async allVaccineIds(euDccOnly = false) {
    let all = await CertifiableVaccine.findAll();
    if (euDccOnly) {
      all = all.filter((v) => v.usableForEuDcc());
    }

    return all.map((vc) => vc.vaccineId);
  }

  usableForEuDcc() {
    return this.euProductCode !== null && this.targetCode !== null && this.manufacturerId !== null;
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
