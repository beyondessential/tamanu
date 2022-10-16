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
import { BaseModel, FindMarkedForUploadOptions, IdRelation } from './BaseModel';
import { IEncounter, EncounterType } from '~/types';
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
import { getCurrentDateTimeString } from '~/ui/helpers/date';

const TIME_OFFSET = 3;

@Entity('encounter')
export class Encounter extends BaseModel implements IEncounter {
  @Column({ type: 'varchar' })
  encounterType: EncounterType;

  @Column()
  startDate: string;

  @Column({ nullable: true })
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
    // const facilityId = await readConfig('facilityId', '');
    const facilityId = 'ref/facility/ba';

    // Find the first department and location that matches the
    // selected facility to provide the default value for mobile.
    const defaultDepartment = await Department.findOne({
      where: { facility: { id: facilityId } },
    });
    const defaultLocation = await Location.findOne({
      where: { facility: { id: facilityId } },
    });

    console.log('facilityId', facilityId);
    console.log('defaultDepartment', defaultDepartment);
    console.log('defaultLocation', defaultLocation);

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

  static shouldExport = true;

  @BeforeInsert()
  @BeforeUpdate()
  async markPatient() {
    // adding an encounter to a patient should mark them for syncing in future
    // we don't need to upload the patient, so we only set markedForSync
    const parent = await this.findParent(Patient, 'patient');
    if (parent) {
      parent.markedForSync = true;
      await parent.save();
    }
  }

  static async findMarkedForUpload(opts: FindMarkedForUploadOptions): Promise<BaseModel[]> {
    const patientId = (opts.channel.match(/^patient\/(.*)\/encounter$/) || [])[1];
    const scheduledVaccineId = (opts.channel.match(/^scheduledVaccine\/(.*)\/encounter/) || [])[1];
    if (patientId) {
      const records = await this.findMarkedForUploadQuery(opts)
        .andWhere('patientId = :patientId', { patientId })
        .getMany();
      return records as BaseModel[];
    }
    if (scheduledVaccineId) {
      const records = await this.findMarkedForUploadQuery(opts)
        .innerJoinAndSelect('Encounter.administeredVaccines', 'AdministeredVaccine')
        .andWhere('AdministeredVaccine.scheduledVaccineId = :scheduledVaccineId', {
          scheduledVaccineId,
        })
        .getMany();
      return records as BaseModel[];
    }

    throw new Error(`Could not extract marked for upload from ${opts.channel}`);
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
