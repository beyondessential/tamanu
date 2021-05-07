import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  BeforeUpdate,
  BeforeInsert,
  RelationId,
} from 'typeorm/browser';
import { startOfDay, addHours, subDays } from 'date-fns';
import { getUniqueId } from 'react-native-device-info';
import { BaseModel, FindMarkedForUploadOptions } from './BaseModel';
import { IEncounter, EncounterType, ReferenceDataType } from '~/types';
import { Patient } from './Patient';
import { Diagnosis } from './Diagnosis';
import { Medication } from './Medication';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { User } from './User';
import { AdministeredVaccine } from './AdministeredVaccine';
import { SurveyResponse } from './SurveyResponse';
import { Vitals } from './Vitals';
import { formatDateForQuery } from '~/infra/db/helpers';
import { SummaryInfo } from '~/ui/navigation/screens/home/Tabs/PatientHome/ReportScreen/SummaryBoard';
import { Referral } from './Referral';

const TIME_OFFSET = 3;

@Entity('encounter')
export class Encounter extends BaseModel implements IEncounter {
  @Column({ type: 'varchar' })
  encounterType: EncounterType;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column({ default: '', nullable: true })
  reasonForEncounter?: string;

  @Index()
  @ManyToOne(() => Patient, (patient) => patient.encounters, { eager: true })
  patient: Patient;

  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(() => User)
  examiner: User;

  @RelationId(({ examiner }) => examiner)
  examinerId: string;

  // TODO: Add model, automatically attach all lab requests to the encounter
  @Column({ nullable: true })
  labRequest?: string;

  // TODO: Is this a model, referenceData or just string?
  @Column({ nullable: true })
  medication?: string;

  @Column({ nullable: true })
  deviceId?: string;

  @ReferenceDataRelation()
  department: ReferenceData;
  @RelationId(({ department }) => department)
  departmentId?: string;

  @ReferenceDataRelation()
  location: ReferenceData;
  @RelationId(({ location }) => location)
  locationId?: string;

  @OneToMany(() => Diagnosis, (diagnosis) => diagnosis.encounter, {
    eager: true,
  })
  diagnoses: Diagnosis[];

  @OneToMany(() => Medication, ({ encounter }) => encounter)
  medications: Medication[];

  @OneToMany(() => Referral, referral => referral.initiatingEncounter)
  initiatedReferrals: Referral[]

  @OneToMany(() => Referral, referral => referral.completingEncounter)
  completedReferrals: Referral[]

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.encounter)
  administeredVaccines: AdministeredVaccine[]

  @OneToMany(() => SurveyResponse, (surveyResponse) => surveyResponse.encounter)
  surveyResponses: SurveyResponse[];

  @OneToMany(() => Vitals, ({ encounter }) => encounter)
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

    return Encounter.createAndSaveOne({
      patient: patientId,
      examiner: userId,
      startDate: new Date(),
      endDate: null,
      encounterType: EncounterType.Clinic,
      reasonForEncounter: '',
      department: (
        await ReferenceData.getAnyOfType(ReferenceDataType.Department)
      ).id,
      location: (await ReferenceData.getAnyOfType(ReferenceDataType.Location))
        .id,
      deviceId: getUniqueId(),
      ...createdEncounterOptions,
    });
  }

  static async getForPatient(patientId: string): Promise<Encounter[]> {
    const repo = this.getRepository();

    return repo.find({
      where: { patient: { id: patientId } },
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
        (subQuery) => subQuery
          .select('surveyResponse.id', 'id')
          .addSelect('surveyResponse.encounterId', 'encounterId')
          .from('survey_response', 'surveyResponse')
          .where(
            'surveyResponse.surveyId = :surveyId',
            { surveyId }),
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

  static shouldExport = true;

  @BeforeInsert()
  @BeforeUpdate()
  async markPatient() {
    // adding an encounter to a patient should mark them for syncing in future
    // we don't need to upload the patient, so we only set markedForSync
    await this.markParent(Patient, 'patient', 'markedForSync');
  }

  static async findMarkedForUpload(
    opts: FindMarkedForUploadOptions,
  ): Promise<BaseModel[]> {
    const patientId = opts.channel.match(/^patient\/(.*)\/encounter$/)[1];
    if (!patientId) {
      throw new Error(`Could not extract patientId from ${opts.channel}`);
    }

    const records = await this.findMarkedForUploadQuery(opts)
      .andWhere('patientId = :patientId', { patientId })
      .getMany();

    return records as BaseModel[];
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
  ];
}
