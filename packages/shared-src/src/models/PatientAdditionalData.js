import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { initSyncForModelNestedUnderPatient } from './sync';

export class PatientAdditionalData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        placeOfBirth: Sequelize.STRING,
        bloodType: Sequelize.STRING,
        primaryContactNumber: Sequelize.STRING,
        secondaryContactNumber: Sequelize.STRING,
        maritalStatus: Sequelize.STRING,
        cityTown: Sequelize.STRING,
        streetVillage: Sequelize.STRING,
        educationalLevel: Sequelize.STRING,
        socialMedia: Sequelize.STRING,
        title: Sequelize.STRING,
        birthCertificate: Sequelize.STRING,
        drivingLicense: Sequelize.STRING,
        passport: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: initSyncForModelNestedUnderPatient(this, 'additionalData'),
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.User, {
      foreignKey: 'registeredById',
      as: 'registeredBy',
    });

    const referenceRelation = name =>
      this.belongsTo(models.ReferenceData, {
        foreignKey: `${name}Id`,
        as: name,
      });

    referenceRelation('nationality');
    referenceRelation('country');
    referenceRelation('division');
    referenceRelation('subdivision');
    referenceRelation('medicalArea');
    referenceRelation('nursingZone');
    referenceRelation('settlement');
    referenceRelation('ethnicity');
    referenceRelation('occupation');
    referenceRelation('religion');
    referenceRelation('patientBillingType');
    referenceRelation('countryOfBirth');
  }

  static getFullReferenceAssociations() {
    return ['countryOfBirth'];
  }
}
