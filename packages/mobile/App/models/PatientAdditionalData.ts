import {
  Entity,
  Column,
  RelationId,
  ManyToOne,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm/browser';
import { snakeCase, isEmpty } from 'lodash';
import { BaseModel, IdRelation } from './BaseModel';
import { IPatientAdditionalData } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { Patient } from './Patient';
import { SYNC_DIRECTIONS } from './types';
import { CURRENT_SYNC_TIME, getSyncTick } from '~/services/sync';
import { Database } from '~/infra/db';
import { extractIncludedColumns } from '~/services/sync/utils/extractIncludedColumns';

const METADATA_FIELDS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
  'updatedAtByField',
];
@Entity('patient_additional_data')
export class PatientAdditionalData extends BaseModel implements IPatientAdditionalData {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @PrimaryColumn()
  id: string;

  @ManyToOne(
    () => Patient,
    patient => patient.additionalData,
  )
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  @Column({ nullable: true })
  placeOfBirth?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  bloodType?: string;

  @Column({ nullable: true })
  primaryContactNumber?: string;

  @Column({ nullable: true })
  secondaryContactNumber?: string;

  @Column({ nullable: true })
  maritalStatus?: string;

  @Column({ nullable: true })
  cityTown?: string;

  @Column({ nullable: true })
  streetVillage?: string;

  @Column({ nullable: true })
  educationalLevel?: string;

  @Column({ nullable: true })
  socialMedia?: string;

  @Column({ nullable: true })
  birthCertificate?: string;

  @Column({ nullable: true })
  drivingLicense?: string;

  @Column({ nullable: true })
  passport?: string;

  @Column({ nullable: true })
  emergencyContactName?: string;

  @Column({ nullable: true })
  emergencyContactNumber?: string;

  @ReferenceDataRelation()
  nationality?: ReferenceData;
  @RelationId(({ nationality }) => nationality)
  nationalityId?: string;

  @ReferenceDataRelation()
  country?: ReferenceData;
  @RelationId(({ country }) => country)
  countryId?: string;

  @ReferenceDataRelation()
  division?: ReferenceData;
  @RelationId(({ division }) => division)
  divisionId?: string;

  @ReferenceDataRelation()
  subdivision?: ReferenceData;
  @RelationId(({ subdivision }) => subdivision)
  subdivisionId?: string;

  @ReferenceDataRelation()
  medicalArea?: ReferenceData;
  @RelationId(({ medicalArea }) => medicalArea)
  medicalAreaId?: string;

  @ReferenceDataRelation()
  nursingZone?: ReferenceData;
  @RelationId(({ nursingZone }) => nursingZone)
  nursingZoneId?: string;

  @ReferenceDataRelation()
  settlement?: ReferenceData;
  @RelationId(({ settlement }) => settlement)
  settlementId?: string;

  @ReferenceDataRelation()
  ethnicity?: ReferenceData;
  @RelationId(({ ethnicity }) => ethnicity)
  ethnicityId?: string;

  @ReferenceDataRelation()
  occupation?: ReferenceData;
  @RelationId(({ occupation }) => occupation)
  occupationId?: string;

  @ReferenceDataRelation()
  religion?: ReferenceData;
  @IdRelation()
  religionId?: string | null;

  @ReferenceDataRelation()
  patientBillingType?: ReferenceData;
  @IdRelation()
  patientBillingTypeId?: string | null;

  @ReferenceDataRelation()
  countryOfBirth?: ReferenceData;
  @IdRelation()
  countryOfBirthId?: string | null;

  @Column({ nullable: true })
  updatedAtByField: string;

  @BeforeInsert()
  async assignIdAsPatientId(): Promise<void> {
    this.id = this.patient;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setUpdatedAtByField(): Promise<void> {
    const syncTick = await getSyncTick(Database.models, CURRENT_SYNC_TIME);
    const includedColumns = extractIncludedColumns(PatientAdditionalData, METADATA_FIELDS);
    let newUpdatedAtByField = {};
    const oldPatientAdditionalData = await PatientAdditionalData.findOne({
      id: this.id,
    });

    // only calculate updatedAtByField if a modified version hasn't been explicitly passed,
    // e.g. from a central record syncing down to this device
    if (!oldPatientAdditionalData) {
      includedColumns.forEach(camelCaseKey => {
        if (this[snakeCase(camelCaseKey)] !== undefined) {
          newUpdatedAtByField[snakeCase(camelCaseKey)] = syncTick;
        }
      });
    } else if (
      !this.updatedAtByField ||
      this.updatedAtByField === oldPatientAdditionalData.updatedAtByField
    ) {
      // retain the old sync ticks from previous updatedAtByField
      newUpdatedAtByField = JSON.parse(oldPatientAdditionalData.updatedAtByField);
      includedColumns.forEach(camelCaseKey => {
        const snakeCaseKey = snakeCase(camelCaseKey);
        // when saving relation id for instance, typeorm requires saving using
        // relation name instead (eg: when saving 'nationalityId', the value is in 'nationality')
        const relationKey = camelCaseKey.slice(-2) === 'Id' ? camelCaseKey.slice(0, -2) : null;
        const oldValue = oldPatientAdditionalData[camelCaseKey];
        // if this is a relation key, the value may be in form of ( { id: 'abc' } ),
        // or it may be just the id
        const currentValue = relationKey
          ? this[relationKey]?.id || this[relationKey]
          : this[camelCaseKey];

        if (oldValue !== currentValue) {
          newUpdatedAtByField[snakeCaseKey] = syncTick;
        }
      });
    }

    if (!isEmpty(newUpdatedAtByField)) {
      this.updatedAtByField = JSON.stringify(newUpdatedAtByField);
    }
  }

  @BeforeInsert()
  async markPatientForSync(): Promise<void> {
    await Patient.markForSync(this.patient);
  }

  static getTableNameForSync(): string {
    return 'patient_additional_data';
  }

  static async getForPatient(patientId: string): Promise<PatientAdditionalData> {
    // use a query builder instead of find, as apparently there's some
    // misbehaviour around how typeorm traverses this relation
    return await PatientAdditionalData.getRepository()
      .createQueryBuilder('patient_additional_data')
      .where('patient_additional_data.patientId = :patientId', { patientId })
      .getOne();
  }

  static async getOrCreateForPatient(patientId: string): Promise<PatientAdditionalData> {
    // See if there's an existing PAD we can use
    const existing = await PatientAdditionalData.getForPatient(patientId);
    if (existing) {
      return existing;
    }

    // otherwise create a new one
    return PatientAdditionalData.createAndSaveOne({
      patient: patientId,
    });
  }

  static async updateForPatient(patientId: string, values: Partial<PatientAdditionalData>) {
    const additionalData = await PatientAdditionalData.getOrCreateForPatient(patientId);
    await PatientAdditionalData.updateValues(additionalData.id, values);
  }

  static sanitizeRecordDataForPush(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };

      // Convert updatedAtByField to JSON because central server expects it to be JSON
      if (row.data.updatedAtByField) {
        sanitizedRow.data.updatedAtByField = JSON.parse(sanitizedRow.data.updatedAtByField);
      }

      return sanitizedRow;
    });
  }

  static sanitizePulledRecordData(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };

      // Convert updatedAtByField to JSON STRING
      // because updatedAtByField's type is string in mobile
      // (Sqlite does not support JSON type)
      if (row.data.updatedAtByField) {
        sanitizedRow.data.updatedAtByField = JSON.stringify(sanitizedRow.data.updatedAtByField);
      }

      return sanitizedRow;
    });
  }
}
