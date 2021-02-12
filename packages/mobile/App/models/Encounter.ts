import { Entity, Column, ManyToOne, OneToMany, Index, MoreThan, RelationId } from 'typeorm/browser';
import { startOfDay, addHours } from 'date-fns';
import { BaseModel, FindMarkedForUploadOptions } from './BaseModel';
import { IEncounter, EncounterType, ReferenceDataType } from '~/types';
import { Patient } from './Patient';
import { Diagnosis } from './Diagnosis';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { AdministeredVaccine } from './AdministeredVaccine';
import { SurveyResponse } from './SurveyResponse';
import { formatDateForQuery } from '~/infra/db/helpers';

@Entity('encounter')
export class Encounter extends BaseModel implements IEncounter {
  @Column({ type: 'varchar' })
  encounterType: EncounterType;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column({ default: '' })
  reasonForEncounter: string;

  @Index()
  @ManyToOne(() => Patient, patient => patient.encounters, { eager: true })
  patient: Patient;

  @RelationId((encounter: Encounter) => encounter.patient)
  patientId: string;

  // TODO: Add model and add examiner dropdown for this field
  @Column({ nullable: true })
  examiner?: string;

  // TODO: Add model, automatically attach all lab requests to the encounter
  @Column({ nullable: true })
  labRequest?: string;

  // TODO: Is this a model, referenceData or just string?
  @Column({ nullable: true })
  medication?: string;

  @ReferenceDataRelation()
  department: ReferenceData;

  @ReferenceDataRelation()
  location: ReferenceData;

  @OneToMany(() => Diagnosis, diagnosis => diagnosis.encounter, { eager: true })
  diagnoses: Diagnosis[]

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.encounter)
  administeredVaccines: AdministeredVaccine[]

  @OneToMany(() => SurveyResponse, surveyResponse => surveyResponse.encounter)
  surveyResponses: SurveyResponse[]

  static async getOrCreateCurrentEncounter(
    patientId: string, createdEncounterOptions: any,
  ): Promise<Encounter> {
    const repo = this.getRepository();
    const timeOffset = 3;
    const date = addHours(startOfDay(new Date()), timeOffset);

    const found = await repo.createQueryBuilder('encounter')
      .where('patientId = :patientId', { patientId })
      .andWhere('startDate >= :date', { date: formatDateForQuery(date) })
      .getOne();

    if (found) return found;

    return Encounter.create({
      patient: patientId,
      startDate: new Date(),
      endDate: null,
      encounterType: EncounterType.Clinic,
      reasonForEncounter: '',
      department: (await ReferenceData.getAnyOfType(ReferenceDataType.Department)).id,
      location: (await ReferenceData.getAnyOfType(ReferenceDataType.Location)).id,
      ...createdEncounterOptions,
    });
  }

  static async getForPatient(patientId: string): Promise<Encounter[]> {
    const repo = this.getRepository();

    return repo.find({
      patientId,
    });
  }

  static shouldExport = true;

  static async mapSyncablePatientIds(
    callback: (patientId: string) => Promise<void> | void,
    limit: number = 100,
  ): Promise<void> {
    // hides the complexity of querying successive batches of ids

    // sync any patient that's marked for sync
    await Patient.mapMarkedForSyncIds(patientId => callback(patientId), limit);

    // sync any patient for which encounters have been created
    let baseQuery = this.getRepository().createQueryBuilder('encounter')
      .select('encounter.patientId AS patientId')
      .distinctOn(['patientId'])
      .orderBy('patientId')
      .where('encounter.markedForUpload = ?', [true])
      .limit(limit);
    let lastSeenId: string = null;
    do {
      const query = lastSeenId ? baseQuery.andWhere('patientId > ?', [lastSeenId]) : baseQuery;
      const patients = await query.getRawMany();
      const patientIds = patients.map(({ patientId }) => patientId);
      lastSeenId = patientIds[patientIds.length - 1];
      for (const patientId of patientIds) {
        await callback(patientId);
      }
    } while (!!lastSeenId);
  }

  static async findMarkedForUpload(
    opts: FindMarkedForUploadOptions,
  ): Promise<BaseModel[]> {
    const patientId = opts.channel.split('/')[1];
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
  ];

  // TODO: add examiner
}
