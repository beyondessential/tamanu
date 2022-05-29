import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class CertifiableVaccine extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        icd11Code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        atcCode: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        euProductCode: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        maximumDosage: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      {
        ...options,
        // This is essentially reference/imported data
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PUSH_ONLY },
        validate: {
          mustHaveVaccine() {
            if (!this.deletedAt && !this.vaccineId) {
              throw new InvalidOperationError(
                'A certifiable vaccine must have a vaccine.',
              );
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['encounter', 'scheduledVaccine'];
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'vaccineId',
      as: 'vaccine',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'manufacturerId',
      as: 'manufacturer',
    });
  }

  usableForEuDcc() {
    return this.euProductCode !== null && this.manufacturerId !== null;
  }
}
