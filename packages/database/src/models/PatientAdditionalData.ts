import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import type { InitOptions, ModelProperties, Models } from '../types/model';

export class PatientAdditionalData extends Model {
  declare id: string;
  declare patientId: string;
  declare placeOfBirth?: string;
  declare bloodType?: string;
  declare primaryContactNumber?: string;
  declare secondaryContactNumber?: string;
  declare maritalStatus?: string;
  declare cityTown?: string;
  declare streetVillage?: string;
  declare educationalLevel?: string;
  declare socialMedia?: string;
  declare title?: string;
  declare birthCertificate?: string;
  declare drivingLicense?: string;
  declare passport?: string;
  declare passportNumber?: string;
  declare emergencyContactName?: string;
  declare emergencyContactNumber?: string;
  declare motherId?: string;
  declare fatherId?: string;
  declare healthCenterId?: string;
  declare secondaryVillageId?: string;
  declare updatedAtByField?: Record<string, any>;
  declare insurerPolicyNumber?: string;
  declare registeredById?: string;
  declare nationalityId?: string;
  declare countryId?: string;
  declare divisionId?: string;
  declare subdivisionId?: string;
  declare medicalAreaId?: string;
  declare nursingZoneId?: string;
  declare settlementId?: string;
  declare ethnicityId?: string;
  declare occupationId?: string;
  declare religionId?: string;
  declare patientBillingTypeId?: string;
  declare countryOfBirthId?: string;
  declare insurerId?: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          // patient additional data records use a patient_id as the primary key, acting as a
          // db-level enforcement of one per patient, and simplifying sync
          type: `TEXT GENERATED ALWAYS AS ("patient_id")`,
          set() {
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
        healthCenterId: DataTypes.STRING,
        secondaryVillageId: {
          type: DataTypes.STRING,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        updatedAtByField: DataTypes.JSON,
        insurerPolicyNumber: DataTypes.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
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

    this.belongsTo(models.Facility, {
      foreignKey: 'healthCenterId',
      as: 'healthCenter',
    });

    const referenceRelation = (name: string) =>
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
    referenceRelation('insurer');
  }

  static getFullReferenceAssociations() {
    return ['countryOfBirth', 'country', 'nationality', 'ethnicity', 'insurer'];
  }

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }
  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;

  static async getForPatient(patientId: string) {
    return this.findOne({ where: { patientId } });
  }

  static async getOrCreateForPatient(patientId: string) {
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

  static async updateForPatient(patientId: string, values: ModelProperties<PatientAdditionalData>) {
    const additionalData = await this.getOrCreateForPatient(patientId);
    await additionalData.update(values);
    return additionalData;
  }
}
