import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { buildPatientLinkedSyncFilter } from './buildPatientLinkedSyncFilter';

export class PatientAdditionalData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          type: `TEXT GENERATED ALWAYS AS ("patient_id")`,
          set() {
            // patient additional data records use a patient_id as the primary key, acting as a
            // db-level enforcement of one per patient, and simplifying sync
            // any sets of the convenience generated "id" field can be ignored, so do nothing here
          },
        },
        patientId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
        placeOfBirth: DataTypes.STRING,
        bloodType: DataTypes.STRING,
        primaryContactNumber: DataTypes.STRING,
        secondaryContactNumber: DataTypes.STRING,
        maritalStatus: DataTypes.STRING,
        cityTown: DataTypes.STRING,
        streetVillage: DataTypes.STRING,
        educationalLevel: DataTypes.STRING,
        socialMedia: DataTypes.STRING,
        title: DataTypes.STRING,
        birthCertificate: DataTypes.STRING,
        drivingLicense: DataTypes.STRING,
        passport: DataTypes.STRING,
        emergencyContactName: DataTypes.STRING,
        emergencyContactNumber: DataTypes.STRING,
        motherId: DataTypes.STRING,
        fatherId: DataTypes.STRING,
        updatedAtByField: DataTypes.JSON,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
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

  static buildSyncFilter = buildPatientLinkedSyncFilter;

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
