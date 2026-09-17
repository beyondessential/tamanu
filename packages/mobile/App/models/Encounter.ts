import { addHours, startOfDay, subDays } from 'date-fns';
import { getUniqueId } from 'react-native-device-info';
import {
  AfterInsert,
  BeforeInsert,
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { formatDateForQuery } from '~/infra/db/formatDateForQuery';
import { type ReferenceData, ReferenceDataRelation } from '~/models/ReferenceData';
import { readConfig } from '~/services/config';
import { EncounterType, type IEncounter } from '~/types';
import { getCurrentDateTimeString, toDateTimeString } from '~/ui/helpers/date';
import type { SummaryInfo } from '~/ui/navigation/screens/home/Tabs/PatientHome/ReportScreen/SummaryBoard';
import { AdministeredVaccine } from './AdministeredVaccine';
import { BaseModel, IdRelation } from './BaseModel';
import { DateTimeStringColumn } from './DateColumns';
import { Department } from './Department';
import { Diagnosis } from './Diagnosis';
import { EncounterHistory } from './EncounterHistory';
import { EncounterPrescription } from './EncounterPrescription';
import { LabRequest } from './LabRequest';
import { Location } from './Location';
import { Note } from './Note';
import { Patient } from './Patient';
import { Referral } from './Referral';
import { SurveyResponse } from './SurveyResponse';
import { Task } from './Task';
import { SYNC_DIRECTIONS } from './types';
import { User } from './User';
import { Vitals } from './Vitals';

const TIME_OFFSET = 3;

@Entity('encounters')
export class Encounter extends BaseModel implements IEncounter {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ type: 'varchar' })
  encounterType: EncounterType;

  @DateTimeStringColumn()
  startDate: string;

  @DateTimeStringColumn({ nullable: true })
  endDate?: string;

  @Column({ default: '', nullable: true })
  reasonForEncounter?: string;

  @Index()
  @ManyToOne(() => Patient, patient => patient.encounters, { eager: true })
  patient: Patient;

  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(() => User)
  examiner: User;

  @RelationId(({ examiner }) => examiner)
  examinerId: string;

  @Column({ nullable: true })
  deviceId?: string;

  @ManyToOne(() => Department)
  department: Department;

  @RelationId(({ department }) => department)
  departmentId: string;

  @ReferenceDataRelation()
  patientBillingType?: ReferenceData;

  @IdRelation()
  patientBillingTypeId?: string | null;

  @ManyToOne(() => Location)
  location: Location;

  @RelationId(({ location }) => location)
  locationId: string;

  @OneToMany(() => LabRequest, labRequest => labRequest.encounter)
  labRequests: LabRequest[];

  @OneToMany(() => EncounterHistory, encounterHistory => encounterHistory.encounter)
  encounterHistories: EncounterHistory[];

  @OneToMany(() => Diagnosis, diagnosis => diagnosis.encounter)
  diagnoses: Diagnosis[];

  @OneToMany(() => EncounterPrescription, encounterPrescription => encounterPrescription.encounter)
  encounterPrescriptions: EncounterPrescription[];

  @OneToMany(() => Referral, referral => referral.initiatingEncounter)
  initiatedReferrals: Referral[];

  @OneToMany(() => Referral, referral => referral.completingEncounter)
  completedReferrals: Referral[];

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.encounter)
  administeredVaccines: AdministeredVaccine[];

  @OneToMany(() => SurveyResponse, surveyResponse => surveyResponse.encounter)
  surveyResponses: SurveyResponse[];

  @OneToMany(() => Vitals, ({ encounter }) => encounter)
  vitals: Vitals[];

  @OneToMany(() => Task, task => task.encounter)
  tasks: Task[];

  @BeforeInsert()
  async markPatientForSync(): Promise<void> {
    await Patient.markForSync(this.patient);
  }

  @AfterInsert()
  async snapshotEncounter(): Promise<void> {
    await EncounterHistory.createSnapshot(this, { date: this.startDate });
  }

  static async getCurrentEncounterForPatient(patientId: string): Promise<Encounter | undefined> {
    const repo = Encounter.getRepository();

    // The 3 hour offset is a completely arbitrary time we decided would be safe to
    // close the previous days encounters at, rather than midnight.
    const now = new Date();
    const cutover = addHours(startOfDay(now), TIME_OFFSET);
    // Before the 3am cutover we are still within the previous day's clinical window, so the
    // boundary is yesterday's cutover — otherwise it would sit in the future and match nothing.
    const dayStart = now < cutover ? subDays(cutover, 1) : cutover;

    return (
      repo
        .createQueryBuilder('encounter')
        .where('patientId = :patientId', { patientId })
        // startDate is stored as a local ISO 9075 string, so compare against a local ISO 9075
        // boundary directly. datetime(:epoch, 'unixepoch') renders UTC and would be offset.
        .andWhere('startDate >= :date', {
          date: toDateTimeString(dayStart),
        })
        .orderBy('startDate', 'DESC')
        .addOrderBy('createdAt', 'DESC')
        .addOrderBy('id', 'DESC')
        .getOne()
    );
  }

  static async getActiveEncounterForPatient(patientId: string): Promise<Encounter | undefined> {
    const repo = Encounter.getRepository();

    return repo
      .createQueryBuilder('encounter')
      .where('patientId = :patientId', { patientId })
      .andWhere('endDate IS NULL')
      .orderBy('startDate', 'DESC')
      .addOrderBy('createdAt', 'DESC')
      .addOrderBy('id', 'DESC')
      .getOne();
  }

  static async createEncounter(
    patientId: string,
    userId: string,
    createdEncounterOptions: any = {},
  ): Promise<Encounter> {
    // Read the selected facility for this client
    const facilityId = await readConfig('facilityId', '');
    let { departmentId, locationId } = createdEncounterOptions;

    if (!departmentId) {
      // Find the first department and location that matches the
      // selected facility to provide the default value for mobile.
      const defaultDepartment = await Department.findOne({
        where: { facility: { id: facilityId } },
      });

      if (!defaultDepartment) {
        throw new Error(
          `No default Department is configured for facility: ${facilityId}. You need to update the Department reference data.`,
        );
      }

      departmentId = defaultDepartment.id;
    }

    if (!locationId) {
      const defaultLocation = await Location.findOne({
        where: { facility: { id: facilityId } },
      });

      if (!defaultLocation) {
        throw new Error(
          `No default Location is configured for facility: ${facilityId}. You need to update the Location reference data.`,
        );
      }

      locationId = defaultLocation.id;
    }

    return Encounter.createAndSaveOne({
      patient: patientId,
      examiner: userId,
      startDate: getCurrentDateTimeString(),
      endDate: null,
      encounterType: EncounterType.Clinic,
      reasonForEncounter: '',
      department: departmentId,
      location: locationId,
      deviceId: getUniqueId(),
      ...createdEncounterOptions,
    });
  }

  static async getOrCreateActiveEncounter(
    patientId: string,
    userId: string,
    createdEncounterOptions: any = {},
  ): Promise<Encounter> {
    const activeEncounter = await Encounter.getActiveEncounterForPatient(patientId);

    if (activeEncounter) {
      return activeEncounter;
    }

    const encounter = await Encounter.createEncounter(patientId, userId, createdEncounterOptions);
    return encounter;
  }

  static async getOrCreateCurrentEncounter(
    patientId: string,
    userId: string,
    createdEncounterOptions: any = {},
  ): Promise<Encounter> {
    const currentEncounter = await Encounter.getCurrentEncounterForPatient(patientId);

    if (currentEncounter) {
      return currentEncounter;
    }

    const encounter = await Encounter.createEncounter(patientId, userId, createdEncounterOptions);
    return encounter;
  }

  /**
   * Encounters for the visits history, each with its clinical notes and diagnoses, in one query.
   * Diagnoses are joined here rather than eagerly on the relation, as this is the only place that
   * reads them. Notes hang off a polymorphic recordId rather than a relation, so they are mapped
   * onto the encounter by join condition.
   */
  static getForPatient(patientId: string): Promise<Encounter[]> {
    return Encounter.getRepository()
      .createQueryBuilder('encounter')
      .leftJoinAndSelect('encounter.location', 'location')
      .leftJoinAndSelect('location.facility', 'facility')
      .leftJoinAndSelect('encounter.diagnoses', 'diagnosis')
      .leftJoinAndSelect('diagnosis.diagnosis', 'diagnosisReferenceData')
      .leftJoinAndMapMany('encounter.notes', Note, 'note', 'note.recordId = encounter.id')
      .where('encounter.patientId = :patientId', { patientId })
      .orderBy('encounter.startDate', 'DESC')
      .addOrderBy('encounter.createdAt', 'DESC')
      .addOrderBy('encounter.id', 'DESC')
      .getMany();
  }

  static async getTotalEncountersAndResponses(surveyId: string): Promise<SummaryInfo[]> {
    const repo = Encounter.getRepository();
    // 28 days ago for report
    const date = subDays(addHours(startOfDay(new Date()), TIME_OFFSET), 28);
    const query = repo
      .createQueryBuilder('encounter')
      .select('date(encounter.startDate)', 'encounterDate')
      .addSelect('count(distinct encounter.patientId)', 'totalEncounters')
      .addSelect('count(sr.id)', 'totalSurveys')
      .leftJoin(
        subQuery =>
          subQuery
            .select('surveyResponse.id', 'id')
            .addSelect('surveyResponse.encounterId', 'encounterId')
            .from('survey_responses', 'surveyResponse')
            .where('surveyResponse.surveyId = :surveyId', { surveyId }),
        'sr',
        '"sr"."encounterId" = encounter.id',
      )
      .where("encounter.startDate >= datetime(:date, 'unixepoch')", {
        date: formatDateForQuery(date),
      })
      .andWhere('encounter.deviceId = :deviceId', { deviceId: getUniqueId() })
      .groupBy('date(encounter.startDate)')
      .orderBy('encounterDate', 'ASC');

    return query.getRawMany();
  }
}
