import { Entity, Column, OneToMany, Index } from 'typeorm/browser';
import { getUniqueId } from 'react-native-device-info';
import { addHours, startOfDay, subYears } from 'date-fns';
import { readConfig } from '~/services/config';
import { BaseModel, IdRelation } from './BaseModel';
import { Encounter } from './Encounter';
import { PatientIssue } from './PatientIssue';
import { PatientSecondaryId } from './PatientSecondaryId';
import { IPatient, IPatientAdditionalData } from '~/types';
import { formatDateForQuery } from '~/infra/db/helpers';
import { PatientAdditionalData } from './PatientAdditionalData';
import { PatientFacility } from './PatientFacility';
import { ReferenceData, NullableReferenceDataRelation } from './ReferenceData';
const TIME_OFFSET = 3;

@Entity('patient')
export class Patient extends BaseModel implements IPatient {
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

  @Column({ nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  email?: string;

  @Column()
  sex: string;

  @Index()
  @NullableReferenceDataRelation()
  village?: ReferenceData;
  @IdRelation()
  villageId?: string | null;

  @OneToMany(
    () => PatientAdditionalData,
    additionalData => additionalData.patient,
  )
  additionalData: IPatientAdditionalData;

  @OneToMany(
    () => Encounter,
    encounter => encounter.patient,
  )
  encounters: Encounter[];

  @OneToMany(
    () => PatientIssue,
    issue => issue.patient,
  )
  issues: PatientIssue[];

  @OneToMany(
    () => PatientSecondaryId,
    secondaryId => secondaryId.patient,
  )
  secondaryIds: PatientSecondaryId[];

  static shouldExport = true;

  static async markForSync(patientId: string): Promise<void> {
    const facilityId = await readConfig('facilityId', '');
    const patientFacility = await PatientFacility.findOne({
      where: { patient: patientId, facility: facilityId },
    });

    if (!patientFacility) {
      await PatientFacility.createAndSaveOne({ patient: patientId, facility: facilityId });
    }
  }

  static async findRecentlyViewed(): Promise<Patient[]> {
    const patientIds: string[] = JSON.parse(await readConfig('recentlyViewedPatients', '[]'));
    if (patientIds.length === 0) return [];

    const list = await this.getRepository().findByIds(patientIds);

    return (
      patientIds
        // map is needed to make sure that patients are in the same order as in recentlyViewedPatients
        // (typeorm findByIds doesn't guarantee return order)
        .map(storedId => list.find(({ id }) => id === storedId))
        // filter removes patients who couldn't be found (which occurs when a patient was deleted)
        .filter(patient => !!patient)
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
        subQuery =>
          subQuery
            .select('surveyResponse.id', 'id')
            .addSelect('surveyResponse.encounterId', 'encounterId')
            .from('survey_response', 'surveyResponse')
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
        subQuery =>
          subQuery
            .select('surveyResponse.id', 'id')
            .addSelect('surveyResponse.encounterId', 'encounterId')
            .from('survey_response', 'surveyResponse')
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
        subQuery =>
          subQuery
            .select('surveyResponse.id', 'id')
            .addSelect('surveyResponse.encounterId', 'encounterId')
            .from('survey_response', 'surveyResponse')
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
}
