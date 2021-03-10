import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class Patient extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        displayId: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
        },
        title: Sequelize.STRING,
        firstName: Sequelize.STRING,
        middleName: Sequelize.STRING,
        lastName: Sequelize.STRING,
        culturalName: Sequelize.STRING,

        dateOfBirth: Sequelize.DATE,
        sex: {
          type: Sequelize.ENUM('male', 'female', 'other'),
          allowNull: false,
        },
        bloodType: Sequelize.STRING,
        additionalDetails: Sequelize.TEXT,
      },
      {
        ...options,
        indexes: [{ fields: ['display_id'] }, { fields: ['last_name'] }],
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Encounter, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'villageId',
      as: 'village',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'ethnicityId',
      as: 'ethnicity',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'nationalityId',
      as: 'nationality',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'countryId',
      as: 'country',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'divisionId',
      as: 'division',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'subdivisionId',
      as: 'subdivision',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'medicalAreaId',
      as: 'medicalArea',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'nursingZoneId',
      as: 'nursingZone',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'settlementId',
      as: 'settlement',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'occupationId',
      as: 'occupation',
    });
  }

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;
}
