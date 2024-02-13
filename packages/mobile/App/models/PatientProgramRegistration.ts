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

@Entity('patient_program_registration')
export class PatientProgramRegistration extends BaseModel implements IPatientProgramRegistration {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ type: 'varchar', nullable: false, default: RegistrationStatus.Active })
  registrationStatus: RegistrationStatus;

  @DateTimeStringColumn()
  date: DateTimeString;

  // Relations
  @ManyToOne(() => ProgramRegistry)
  programRegistry: IProgramRegistry;
  @RelationId<PatientProgramRegistration>(({ programRegistry }) => programRegistry)
  programRegistryId: ID;

  @ManyToOne(() => Patient)
  patient: IPatient;
  @RelationId<PatientProgramRegistration>(({ patient }) => patient)
  patientId: ID;

  @ManyToOne(() => ProgramRegistryClinicalStatus, undefined, { nullable: true })
  clinicalStatus?: IProgramRegistryClinicalStatus;
  @RelationId<PatientProgramRegistration>(({ clinicalStatus }) => clinicalStatus)
  clinicalStatusId?: ID;

  @NullableReferenceDataRelation()
  village?: IReferenceData;
  @RelationId<PatientProgramRegistration>(({ village }) => village)
  villageId?: ID;

  @ManyToOne(() => Facility, undefined, { nullable: true })
  facility?: IFacility;
  @RelationId<PatientProgramRegistration>(({ facility }) => facility)
  facilityId?: ID;

  @ManyToOne(() => Facility, undefined, { nullable: true })
  registeringFacility?: IFacility;
  @RelationId<PatientProgramRegistration>(({ registeringFacility }) => registeringFacility)
  registeringFacilityId?: ID;

  @ManyToOne(() => User, undefined, { nullable: false })
  clinician: IUser;
  @RelationId<PatientProgramRegistration>(({ clinician }) => clinician)
  clinicianId: ID;

  dateRemoved: DateTimeString;
  removedBy?: IUser;
  removedById?: ID;

  static async getRecentOne(
    programId?: string,
    patientId?: string,
  ): Promise<PatientProgramRegistration> {
    if (!programId || !patientId) return null;
    return this.getRepository(PatientProgramRegistration)
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.programRegistry', 'program_registry')
      .leftJoinAndSelect('program_registry.program', 'program')
      .where('program.id = :programId', { programId })
      .andWhere('registration.patientId = :patientId', { patientId })
      .orderBy('registration.date', 'DESC')
      .getOne();
  }

  static async getMostRecentRegistrationsForPatient(patientId: string) {
    const registrationRepository = this.getRepository(PatientProgramRegistration);

    const GET_MOST_RECENT_REGISTRATIONS_QUERY = `
    SELECT id
      FROM patient_program_registration AS main
      WHERE id = (
        SELECT id
        FROM patient_program_registration AS sub
        WHERE main.patientId = sub.patientId AND main.programRegistryId = sub.programRegistryId
        ORDER BY date DESC, id DESC
        LIMIT 1
      )
    `;

    const mostRecentRegistrations = await registrationRepository
      .createQueryBuilder('registration')
      .where(`registration.id IN (${GET_MOST_RECENT_REGISTRATIONS_QUERY})`)
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

  static getTableNameForSync(): string {
    return 'patient_program_registrations';
  }
}
