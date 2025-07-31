import { Column, Entity, Index, OneToMany, In } from 'typeorm';
import { getUniqueId } from 'react-native-device-info';
import { addHours, parseISO, startOfDay, subYears } from 'date-fns';
import { groupBy } from 'lodash';
import { readConfig } from '~/services/config';
import { BaseModel, IdRelation } from './BaseModel';
import { Encounter } from './Encounter';
import { PatientIssue } from './PatientIssue';
import { PatientSecondaryId } from './PatientSecondaryId';
import { IPatient, IPatientAdditionalData } from '~/types';
import { formatDateForQuery } from '~/infra/db/formatDateForQuery';
import { VitalsDataElements } from '~/ui/helpers/constants';
import { PatientAdditionalData } from './PatientAdditionalData';
import { PatientFacility } from './PatientFacility';
import { NullableReferenceDataRelation, ReferenceData } from './ReferenceData';
import { SYNC_DIRECTIONS } from './types';
import { DateStringColumn } from './DateColumns';
import { PatientContact } from './PatientContact';
import { PatientOngoingPrescription } from './PatientOngoingPrescription';
import { PatientAllergy } from './PatientAllergy';

const TIME_OFFSET = 3;

@Entity('patients')
export class Patient extends BaseModel implements IPatient {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column()
  displayId: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  middleName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  culturalName?: string;

  @DateStringColumn({ nullable: true })
  dateOfBirth?: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  sex: string;

  @Index()
  @NullableReferenceDataRelation()
  village?: ReferenceData;
  @IdRelation()
  villageId?: string | null;

  @OneToMany(() => PatientAdditionalData, (additionalData) => additionalData.patient)
  additionalData: IPatientAdditionalData;

  @OneToMany(() => Encounter, (encounter) => encounter.patient)
  encounters: Encounter[];

  @OneToMany(() => PatientIssue, (issue) => issue.patient)
  issues: PatientIssue[];

  @OneToMany(() => PatientSecondaryId, (secondaryId) => secondaryId.patient)
  secondaryIds: PatientSecondaryId[];

  @OneToMany(() => PatientContact, (contact) => contact.patient)
  contacts: PatientContact[];

  @OneToMany(
    () => PatientOngoingPrescription,
    patientOngoingPrescription => patientOngoingPrescription.patient,
  )
  patientOngoingPrescriptions: PatientOngoingPrescription[];

  @OneToMany(() => PatientAllergy, (allergy) => allergy.patient)
  allergies: PatientAllergy[];

  static async markForSync(patientId: string): Promise<void> {
    const facilityId = await readConfig('facilityId', '');
    const patientFacility = await PatientFacility.findOne({
      where: { patient: { id: patientId }, facility: { id: facilityId } },
    });

    if (!patientFacility) {
      await PatientFacility.createAndSaveOne({ patient: patientId, facility: facilityId });
    }
  }

  static async findRecentlyViewed(): Promise<Patient[]> {
    const patientIds: string[] = JSON.parse(await readConfig('recentlyViewedPatients', '[]'));
    if (patientIds.length === 0) return [];

    const list = await this.getRepository().find({ where: { id: In(patientIds) } });

    return (
      patientIds
        // map is needed to make sure that patients are in the same order as in recentlyViewedPatients
        .map((storedId) => list.find(({ id }) => id === storedId))
        // filter removes patients who couldn't be found (which occurs when a patient was deleted)
        .filter((patient) => !!patient)
    );
  }

  static async getRecentVisitors(surveyId: string): Promise<any[]> {
    const deviceId = getUniqueId();
    const repo = this.getRepository();
    const date = addHours(startOfDay(new Date()), TIME_OFFSET);
    const thirtyYearsAgo = subYears(new Date(), 30);

    const genderQuery = repo
      .createQueryBuilder('patient')
      .select('sex', 'gender')
      .addSelect('count(distinct encounter.patientId)', 'totalVisitors')
      .addSelect('count(distinct surveyResponse.encounterId)', 'totalSurveys')
      .leftJoin('patient.encounters', 'encounter')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('surveyResponse.id', 'id')
            .addSelect('surveyResponse.encounterId', 'encounterId')
            .from('survey_responses', 'surveyResponse')
            .where('surveyResponse.surveyId = :surveyId', { surveyId }),
        'surveyResponse',
        '"surveyResponse"."encounterId" = encounter.id',
      )
      .where("encounter.startDate >= datetime(:date, 'unixepoch')", {
        date: formatDateForQuery(date),
      })
      .andWhere('encounter.deviceId = :deviceId', { deviceId })
      .groupBy('gender')
      .getRawMany();

    const ageRangeQuery = repo
      .createQueryBuilder('patient')
      .select(
        `case when dateOfBirth >= datetime(${formatDateForQuery(
          thirtyYearsAgo,
        )}, 'unixepoch') then 'lessThanThirty' else 'moreThanThirty' end`,
        'ageGroup',
      )
      .addSelect('count(distinct encounter.patientId)', 'totalVisitors')
      .addSelect('count(distinct surveyResponse.encounterId)', 'totalSurveys')
      .leftJoin('patient.encounters', 'encounter')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('surveyResponse.id', 'id')
            .addSelect('surveyResponse.encounterId', 'encounterId')
            .from('survey_responses', 'surveyResponse')
            .where('surveyResponse.surveyId = :surveyId', { surveyId }),
        'surveyResponse',
        '"surveyResponse"."encounterId" = encounter.id',
      )
      .where("encounter.startDate >= datetime(:date, 'unixepoch')", {
        date: formatDateForQuery(date),
      })
      .andWhere('encounter.deviceId = :deviceId', { deviceId })
      .groupBy('ageGroup')
      .getRawMany();

    const totalVisitors = repo
      .createQueryBuilder('patient')
      .select('count(distinct encounter.patientId)', 'totalVisitors')
      .addSelect('count(distinct surveyResponse.encounterId)', 'totalSurveys')
      .leftJoin('patient.encounters', 'encounter')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('surveyResponse.id', 'id')
            .addSelect('surveyResponse.encounterId', 'encounterId')
            .from('survey_responses', 'surveyResponse')
            .where('surveyResponse.surveyId = :surveyId', { surveyId }),
        'surveyResponse',
        '"surveyResponse"."encounterId" = encounter.id',
      )
      .where("encounter.startDate >= datetime(:date, 'unixepoch')", {
        date: formatDateForQuery(date),
      })
      .andWhere('encounter.deviceId = :deviceId', { deviceId })
      .getRawOne();

    return Promise.all([genderQuery, ageRangeQuery, totalVisitors]);
  }

  static async getReferralList(): Promise<any[]> {
    const deviceId = getUniqueId();
    const repo = this.getRepository();
    const date = addHours(startOfDay(new Date()), TIME_OFFSET);

    const query = repo
      .createQueryBuilder('patient')
      .select(['patient.id', 'firstName', 'lastName', 'dateOfBirth', 'sex'])
      .addSelect("COALESCE(referral.referredFacility,'not referred')", 'referredTo')
      .innerJoin('patient.encounters', 'encounter')
      .leftJoin('encounter.initiatedReferrals', 'referral')
      .where("encounter.startDate >= datetime(:date, 'unixepoch')", {
        date: formatDateForQuery(date),
      })
      .andWhere('encounter.deviceId = :deviceId', { deviceId });

    return query.getRawMany();
  }

  static async getVitals(patientId: string): Promise<any> {
    const repo = this.getRepository();
    const results = await repo.query(
      `
      SELECT
        answer.id,
        pde.name,
        answer.dataElementId,
        answer.responseId,
        ssc.config,
        ssc.validationCriteria,
        answer.body
      FROM survey_response_answers answer
      INNER JOIN survey_responses response
        ON response.id = responseId
      INNER JOIN survey_screen_components ssc
        ON ssc.dataElementId = answer.dataElementId
      INNER JOIN program_data_elements pde
        ON pde.id = answer.dataElementId
      INNER JOIN encounters
        ON encounters.id = response.encounterId
      WHERE encounters.patientId = $1
        AND answer.body IS NOT NULL
        AND answer.deletedAt IS NULL
      ORDER BY answer.createdAt desc LIMIT $2
    `,
      [patientId, 500],
    );

    const library = groupBy(results, 'responseId');

    const data = Object.keys(library).reduce((state, key) => {
      const records = library[key];
      const newKey = records.find((x) => x.dataElementId === VitalsDataElements.dateRecorded);
      if (newKey) {
        return { ...state, [newKey.body]: records };
      }
      return state;
    }, {});

    const columns = Object.keys(data).sort((a, b) => parseISO(b).getTime() - parseISO(a).getTime());

    return { data, columns };
  }
}
