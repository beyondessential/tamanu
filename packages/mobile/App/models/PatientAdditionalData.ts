import { Entity, Column, RelationId, OneToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IPatientAdditionalData } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { Patient } from './Patient';

@Entity('patient_additional_data')
export class PatientAdditionalData extends BaseModel implements IPatientAdditionalData {
  @OneToOne(() => Patient, (patient) => patient.additionalData, { eager: true })
  patient: Patient;

  @Column({ nullable: true })
  placeOfBirth?: string;

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

  @Column({ default: false })
  markedForSync: boolean;

  @Column({ type: 'bigint', default: 0 })
  lastSynced: number;
}
