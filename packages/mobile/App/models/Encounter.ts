import { Entity, Column, ManyToOne, OneToMany, Index, RelationId } from 'typeorm/browser';
import { startOfDay, addHours, subDays } from 'date-fns';
import { getUniqueId } from 'react-native-device-info';
import { getManager } from 'typeorm';
import { BaseModel, IdRelation } from './BaseModel';
import { IEncounter, EncounterType, ISurveyResponse } from '~/types';
import { Patient } from './Patient';
import { Diagnosis } from './Diagnosis';
import { Medication } from './Medication';
import { User } from './User';
import { AdministeredVaccine } from './AdministeredVaccine';
import { SurveyResponse } from './SurveyResponse';
import { Vitals } from './Vitals';
import { formatDateForQuery } from '~/infra/db/helpers';
import { SummaryInfo } from '~/ui/navigation/screens/home/Tabs/PatientHome/ReportScreen/SummaryBoard';
import { Department } from './Department';
import { Location } from './Location';
import { Referral } from './Referral';
import { LabRequest } from './LabRequest';
import { readConfig } from '~/services/config';
import { ReferenceData, ReferenceDataRelation } from '~/models/ReferenceData';
import { SYNC_DIRECTIONS } from './types';
import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { DateTimeStringColumn } from './DateColumns';

const TIME_OFFSET = 3;

@Entity('encounter')
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
  @ManyToOne(
    () => Patient,
    patient => patient.encounters,
    { eager: true },
  )
  patient: Patient;

  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(() => User)
  examiner: User;

  @RelationId(({ examiner }) => examiner)
  examinerId: string;

  // TODO: Is this a model, referenceData or just string?
  @Column({ nullable: true })
  medication?: string;

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

  @OneToMany(
    () => LabRequest,
    labRequest => labRequest.encounter,
  )
  labRequests: LabRequest[];

  @OneToMany(
    () => Diagnosis,
    diagnosis => diagnosis.encounter,
    {
      eager: true,
    },
  )
  diagnoses: Diagnosis[];

  @OneToMany(
    () => Medication,
    ({ encounter }) => encounter,
  )
  medications: Medication[];

  @OneToMany(
    () => Referral,
    referral => referral.initiatingEncounter,
  )
  initiatedReferrals: Referral[];

  @OneToMany(
    () => Referral,
    referral => referral.completingEncounter,
  )
  completedReferrals: Referral[];

  @OneToMany(
    () => AdministeredVaccine,
    administeredVaccine => administeredVaccine.encounter,
  )
  administeredVaccines: AdministeredVaccine[];

  @OneToMany(
    () => SurveyResponse,
    surveyResponse => surveyResponse.encounter,
  )
  surveyResponses: SurveyResponse[];

  @OneToMany(
    () => Vitals,
    ({ encounter }) => encounter,
  )
  vitals: Vitals[];

  static async getOrCreateCurrentEncounter(
    patientId: string,
    userId: string,
    createdEncounterOptions: any = {},
  ): Promise<Encounter> {
    const repo = this.getRepository();

    // The 3 hour offset is a completely arbitrary time we decided would be safe to
    // close the previous days encounters at, rather than midnight.
    const date = addHours(startOfDay(new Date()), TIME_OFFSET);

    const found = await repo
      .createQueryBuilder('encounter')
      .where('patientId = :patientId', { patientId })
      .andWhere("startDate >= datetime(:date, 'unixepoch')", {
        date: formatDateForQuery(date),
      })
      .getOne();

    if (found) return found;

    // Read the selected facility for this client
    const facilityId = await readConfig('facilityId', '');

    // Find the first department and location that matches the
    // selected facility to provide the default value for mobile.
    const defaultDepartment = await Department.findOne({
      where: { facility: { id: facilityId } },
    });
    const defaultLocation = await Location.findOne({
      where: { facility: { id: facilityId } },
    });

    return Encounter.createAndSaveOne({
      patient: patientId,
      examiner: userId,
      startDate: getCurrentDateTimeString(),
      endDate: null,
      encounterType: EncounterType.Clinic,
      reasonForEncounter: '',
      department: defaultDepartment.id,
      location: defaultLocation.id,
      deviceId: getUniqueId(),
      ...createdEncounterOptions,
    });
  }

  static async getForPatient(patientId: string): Promise<Encounter[]> {
    const repo = this.getRepository();

    return repo.find({
      where: { patient: { id: patientId } },
      relations: ['location', 'location.facility'],
      order: { startDate: 'DESC' },
    });
  }

  static async getTotalEncountersAndResponses(surveyId: string): Promise<SummaryInfo[]> {
    const repo = this.getRepository();
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
            .from('survey_response', 'surveyResponse')
            .where('surveyResponse.surveyId = :surveyId', { surveyId }),
        'sr',
        '"sr"."encounterId" = encounter.id',
      )
      .where("encounter.startDate >= datetime(:date, 'unixepoch')", {
        date: formatDateForQuery(date),
      })
      .groupBy('date(encounter.startDate)')
      .having('encounter.deviceId = :deviceId', { deviceId: getUniqueId() })
      .orderBy('encounterDate', 'ASC');

    return query.getRawMany();
  }

  static async getVitals(patientId: string): Promise<ISurveyResponse[]> {
    const entityManager = getManager();
    const results = await entityManager.query(
      `SELECT
          json_object(
            'dataElementId', answer.dataElementId,
            'name', MAX(pde.name),
            'config', MAX(ssc.config),
            'records', json_group_object(date.body, answer.body)) result
        FROM
          survey_response_answer answer
        INNER JOIN
          survey_screen_component ssc
        ON
          ssc.dataElementId = answer.dataElementId
        INNER JOIN
          program_data_element pde
        ON
          pde.id = answer.dataElementId
        INNER JOIN
          (SELECT
            responseId, body
          FROM
            survey_response_answer
          INNER JOIN
            survey_response response
          ON
            response.id = responseId
          WHERE
            dataElementId = $2
          AND
            body IS NOT NULL
          AND
            response.encounterId = $1
          ORDER BY body asc LIMIT 50 OFFSET :offset) date
        ON date.responseId = answer.responseId
        GROUP BY answer.dataElementId`,
      ['97c9c1bb-ff12-4fc3-9b80-8947fa12166e', 'pde-PatientVitalsDate'],
    );

    console.log('results', results);
    return results;
  }

  static includedSyncRelations = [
    'administeredVaccines',
    'surveyResponses',
    'surveyResponses.answers',
    'diagnoses',
    'medications',
    'vitals',
    'initiatedReferrals',
    'completedReferrals',
    'labRequests',
    'labRequests.tests',
  ];
}
