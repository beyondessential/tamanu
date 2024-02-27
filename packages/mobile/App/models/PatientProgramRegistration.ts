import { Entity, ManyToOne, RelationId, Column } from 'typeorm/browser';

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

// TypeORM expects keys without the "ID" part. i.e. patient instead of patientId
// and here we have to extract values from the preexistent model to work
const getValuesFromRelations = values => {
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

@Entity('patient_program_registration')
export class PatientProgramRegistration extends BaseModel implements IPatientProgramRegistration {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ type: 'varchar', nullable: false, default: RegistrationStatus.Active })
  registrationStatus: RegistrationStatus;

  @Column({ type: 'boolean', nullable: false, default: 0 })
  isMostRecent: boolean;

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

  // dateRemoved: DateTimeString;
  // removedBy?: IUser;
  // removedById?: ID;

  static async getRecentOne(
    programId?: string,
    patientId?: string,
  ): Promise<PatientProgramRegistration> {
    if (!programId || !patientId) return null;
    return this.getRepository(PatientProgramRegistration)
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.programRegistry', 'program_registry')
      .leftJoinAndSelect('program_registry.program', 'program')
      .where(`registration.isMostRecent = 1`)
      .andWhere('program.id = :programId', { programId })
      .andWhere('registration.patientId = :patientId', { patientId })
      .getOne();
  }

  static async getMostRecentRegistrationsForPatient(patientId: string) {
    const registrationRepository = this.getRepository(PatientProgramRegistration);
    const mostRecentRegistrations = await registrationRepository
      .createQueryBuilder('registration')
      .where(`registration.isMostRecent = 1`)
      .andWhere('registration.registrationStatus != :status', {
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

  static async getRegistrationForDisplay(id: string) {
    const registrationRepository = this.getRepository(PatientProgramRegistration);
    const registrationForDisplay = await registrationRepository
      .createQueryBuilder('registration')
      .where('registration.id = :id', { id })
      .leftJoin('registration.programRegistry', 'programRegistry')
      .leftJoin('registration.patient', 'patient')
      .leftJoin('registration.clinicalStatus', 'clinicalStatus')
      .leftJoin('registration.village', 'village')
      .leftJoin('registration.facility', 'facility')
      .leftJoin('registration.registeringFacility', 'registeringFacility')
      .leftJoin('registration.clinician', 'clinician')
      .select([
        'registration.*',
        'programRegistry.name as programRegistryName',
        "patient.firstName || ' ' || patient.lastName as patientName",
        'clinicalStatus.name as clinicalStatusName',
        'village.name as villageName',
        'facility.name as facilityName',
        'registeringFacility.name as registeringFacilityName',
        'clinician.displayName as clinicianName',
      ])
      .getRawOne();
    return registrationForDisplay;
  }

  static async appendRegistration(
    patientId: string,
    programRegistryId: string,
    data: any,
  ): Promise<PatientProgramRegistration> {
    const { programId } = await ProgramRegistry.findOne({ id: programRegistryId });
    const existingRegistration = await PatientProgramRegistration.getRecentOne(
      programId,
      patientId,
    );
    if (existingRegistration) {
      await PatientProgramRegistration.updateValues(existingRegistration.id, {
        isMostRecent: false,
      });
    }

    return PatientProgramRegistration.createAndSaveOne({
      ...getValuesFromRelations(existingRegistration),
      ...getValuesFromRelations(data),
      ...data,
      programRegistry: programRegistryId,
      patient: patientId,
      isMostRecent: true,
    });
  }

  static getTableNameForSync(): string {
    return 'patient_program_registrations';
  }
}
