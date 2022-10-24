import { Entity, Column, RelationId, ManyToOne, BeforeUpdate, BeforeInsert } from 'typeorm/browser';
import { BaseModel, FindMarkedForUploadOptions, IdRelation } from './BaseModel';
import { IPatientAdditionalData } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { Patient } from './Patient';

@Entity('patient_additional_data')
export class PatientAdditionalData extends BaseModel implements IPatientAdditionalData {
  @ManyToOne(() => Patient, (patient) => patient.additionalData)
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
  telegramChatId?: string;

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

  @Column({ default: false })
  markedForSync: boolean;

  static shouldExport = true;

  @BeforeInsert()
  @BeforeUpdate()
  async markPatient() {
    // Adding or editing additional data should mark the patient for sync
    const parent = await this.findParent(Patient, 'patient');
    if (parent) {
      parent.markedForSync = true;
      await parent.save();
    }
  }

  static async findMarkedForUpload(
    opts: FindMarkedForUploadOptions,
  ): Promise<BaseModel[]> {
    const patientId = opts.channel.match(/^patient\/(.*)\/additionalData$/)[1];
    if (!patientId) {
      throw new Error(`Could not extract patientId from ${opts.channel}`);
    }

    const records = await this.findMarkedForUploadQuery(opts)
      .andWhere('patientId = :patientId', { patientId })
      .getMany();

    return records as BaseModel[];
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
}
