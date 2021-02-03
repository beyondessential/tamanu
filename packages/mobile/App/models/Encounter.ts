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

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.encounter, { eager: true, cascade: ['insert'] })
  administeredVaccines: AdministeredVaccine[]

  @OneToMany(() => SurveyResponse, surveyResponse => surveyResponse.encounter, { eager: true, cascade: ['insert'] })
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
      patient: patientId,
    });
  }

  static shouldExport(): boolean {
    return true;
  }

  static async mapPatientIdsOfMarkedEncounters(
    callback: (patientId: string) => Promise<void> | void,
    { batchSize = 100 }: { batchSize?: number } = {},
  ): Promise<void> {
    // hides the complexity of querying successive batches of ids
    let baseQuery = this.getRepository().createQueryBuilder('encounter')
      .select('encounter.patientId AS patientId')
      .distinctOn(['patientId'])
      .orderBy('patientId')
      .where('encounter.markedForUpload = ?', [true])
      .limit(batchSize);
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
    { limit, after, channel }: FindMarkedForUploadOptions,
  ): Promise<Encounter[]> {
    const repo = this.getRepository();

    const patientId = channel.split('/')[1];
    if (!patientId) {
      throw new Error(`Could not extract patientId from ${channel}`);
    }

    // find any records that come after afterRecord
    const whereAfter = (after instanceof Object) ? { id: MoreThan(after.id) } : {};

    const records = await repo.find({
      where: {
        markedForUpload: true,
        patient: patientId,
        ...whereAfter,
      },
      order: {
        id: 'ASC',
      },
      take: limit,
    });
    return records;
  }

  // TODO: add examiner
  // TODO: cascade diagnosis/administeredvaccine/surveyresponse/surveyresponseanswer changes
}
