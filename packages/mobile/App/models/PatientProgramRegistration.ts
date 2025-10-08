import {
  Entity,
  ManyToOne,
  RelationId,
  Column,
  BeforeInsert,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import {
  DateTimeString,
  ID,
  IFacility,
  IPatient,
  IPatientProgramRegistration,
  IProgramRegistry,
  IProgramRegistryClinicalStatus,
  IReferenceData,
  IUser,
  IPatientProgramRegistrationCondition,
} from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { ProgramRegistry } from './ProgramRegistry';
import { Patient } from './Patient';
import { ProgramRegistryClinicalStatus } from './ProgramRegistryClinicalStatus';
import { NullableReferenceDataRelation } from './ReferenceData';
import { Facility } from './Facility';
import { User } from './User';
import { RegistrationStatus } from '~/constants/programRegistries';
import { DateTimeStringColumn } from './DateColumns';
import { PatientProgramRegistrationCondition } from './PatientProgramRegistrationCondition';

// TypeORM expects keys without the "ID" part. i.e. patient instead of patientId
// and here we have to extract values from the preexistent model to work
const getValuesFromRelations = (values) => {
  if (!values) {
    return {};
  }
  return {
    clinician: values.clinicianId,
    clinicalStatus: values.clinicalStatusId,
    registeringFacility: values.registeringFacilityId,
    village: values.villageId,
    facility: values.facilityId,
  };
};

@Entity('patient_program_registrations')
export class PatientProgramRegistration extends BaseModel implements IPatientProgramRegistration {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @PrimaryColumn()
  id: ID;

  @Column({ type: 'varchar', nullable: false, default: RegistrationStatus.Active })
  registrationStatus: RegistrationStatus;

  @DateTimeStringColumn()
  date: DateTimeString;

  // Relations
  @ManyToOne(() => ProgramRegistry)
  programRegistry: IProgramRegistry;
  @RelationId(({ programRegistry }) => programRegistry)
  programRegistryId: ID;

  @ManyToOne(() => Patient)
  patient: IPatient;
  @RelationId(({ patient }) => patient)
  patientId: ID;

  @ManyToOne(() => ProgramRegistryClinicalStatus, undefined, { nullable: true })
  clinicalStatus?: IProgramRegistryClinicalStatus;
  @RelationId(({ clinicalStatus }) => clinicalStatus)
  clinicalStatusId?: ID;

  @NullableReferenceDataRelation()
  village?: IReferenceData;
  @RelationId(({ village }) => village)
  villageId?: ID;

  @ManyToOne(() => Facility, undefined, { nullable: true })
  facility?: IFacility;
  @RelationId(({ facility }) => facility)
  facilityId?: ID;

  @ManyToOne(() => Facility, undefined, { nullable: true })
  registeringFacility?: IFacility;
  @RelationId(({ registeringFacility }) => registeringFacility)
  registeringFacilityId?: ID;

  @ManyToOne(() => User, undefined, { nullable: false })
  clinician: IUser;
  @RelationId(({ clinician }) => clinician)
  clinicianId: ID;

  @ManyToOne(() => User, undefined, { nullable: true })
  deactivatedClinician?: IUser;
  @RelationId(({ deactivatedClinician }) => deactivatedClinician)
  deactivatedClinicianId?: ID;

  @Column({ type: 'varchar', nullable: true })
  deactivatedDate?: DateTimeString;

  @OneToMany<PatientProgramRegistrationCondition>(
    () => PatientProgramRegistrationCondition,
    ({ patientProgramRegistration }) => patientProgramRegistration,
  )
  conditions: IPatientProgramRegistrationCondition[];

  @BeforeInsert()
  async markPatientForSync(): Promise<void> {
    await Patient.markForSync(this.patient);
  }

  @BeforeInsert()
  async assignIdAsPatientProgramRegistrationId(): Promise<void> {
    // For patient program registrations, we use a composite 
    // primary key of patientId plus programRegistryId
    // N.B. because ';' is used to join the two, we replace any actual occurrence of ';' with ':'
    // to avoid clashes on the joined id
    this.id = `${this.patient.replaceAll(';', ':')};${this.programRegistry.replaceAll(';', ':')}`;
  }

  static async getRecentOne(
    programId?: string,
    patientId?: string,
  ): Promise<PatientProgramRegistration> {
    if (!programId || !patientId) return null;
    return this.getRepository()
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.programRegistry', 'program_registry')
      .leftJoinAndSelect('program_registry.program', 'program')
      .where('program.id = :programId', { programId })
      .andWhere('registration.patientId = :patientId', { patientId })
      .getOne();
  }

  static async getMostRecentRegistrationsForPatient(patientId: string) {
    const registrationRepository = this.getRepository();
    const mostRecentRegistrations = await registrationRepository
      .createQueryBuilder('registration')
      .where('registration.registrationStatus != :status', {
        status: RegistrationStatus.RecordedInError,
      })
      .andWhere('registration.patientId = :patientId', { patientId })
      .leftJoinAndSelect('registration.clinicalStatus', 'clinicalStatus')
      .leftJoinAndSelect('registration.programRegistry', 'programRegistry')
      .orderBy('registration.registrationStatus', 'ASC')
      .addOrderBy('programRegistry.name', 'ASC')
      .getMany();

    return mostRecentRegistrations;
  }

  static async getFullPprById(id: string) {
    const registrationRepository = this.getRepository();
    const fullPpr = await registrationRepository
      .createQueryBuilder('registration')
      .where('registration.id = :id', { id })
      .leftJoinAndSelect('registration.programRegistry', 'programRegistry')
      .leftJoinAndSelect('registration.patient', 'patient')
      .leftJoinAndSelect('registration.clinicalStatus', 'clinicalStatus')
      .leftJoinAndSelect('registration.village', 'village')
      .leftJoinAndSelect('registration.facility', 'facility')
      .leftJoinAndSelect('registration.registeringFacility', 'registeringFacility')
      .leftJoinAndSelect('registration.clinician', 'clinician')
      .getOne();
    return fullPpr;
  }

  static async upsertRegistration(
    patientId: string,
    programRegistryId: string,
    data: any,
  ): Promise<PatientProgramRegistration> {
    const { programId } = await ProgramRegistry.findOne({ where: { id: programRegistryId } });
    const existingRegistration = await PatientProgramRegistration.getRecentOne(
      programId,
      patientId,
    );
    if (existingRegistration) {
      return PatientProgramRegistration.updateValues(existingRegistration.id, {
        ...getValuesFromRelations(existingRegistration),
        ...getValuesFromRelations(data),
        ...data,
        programRegistry: programRegistryId,
        patient: patientId,
      });
    }

    return PatientProgramRegistration.createAndSaveOne({
      ...getValuesFromRelations(existingRegistration),
      ...getValuesFromRelations(data),
      ...data,
      programRegistry: programRegistryId,
      patient: patientId,
    });
  }
}
