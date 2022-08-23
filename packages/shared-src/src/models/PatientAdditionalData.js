import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { initSyncForModelNestedUnderPatient } from './sync';

export class PatientAdditionalData extends Model {
  static init({ primaryKey, ...options }) {
    const nestedSyncConfig = initSyncForModelNestedUnderPatient(this, 'additionalData');
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
        emergencyContactName: Sequelize.STRING,
        emergencyContactNumber: Sequelize.STRING,
        motherId: Sequelize.STRING,
        fatherId: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: {
          ...nestedSyncConfig,
          channelRoutes: [
            ...nestedSyncConfig.channelRoutes,
            {
              route: 'import/patientAdditionalData',
            },
          ],
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.PatientAdditionalData, {
      foreignKey: 'mergedIntoId',
      as: 'mergedInto',
    });

    this.belongsTo(models.User, {
      foreignKey: 'registeredById',
      as: 'registeredBy',
    });

    this.belongsTo(models.Patient, {
      foreignKey: 'motherId',
      as: 'mother',
    });

    this.belongsTo(models.Patient, {
      foreignKey: 'fatherId',
      as: 'father',
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
    return ['countryOfBirth', 'nationality'];
  }

  static async getForPatient(patientId) {
    return this.findOne({ where: { patientId } });
  }

  static async getOrCreateForPatient(patientId) {
    // See if there's an existing PAD we can use
    const existing = await this.getForPatient(patientId);
    if (existing) {
      return existing;
    }

    // otherwise create a new one
    return this.create({
      patientId,
    });
  }

  static async updateForPatient(patientId, values) {
    const additionalData = await this.getOrCreateForPatient(patientId);
    await additionalData.update(values);
    return additionalData;
  }
}
