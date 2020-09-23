import { Entity, Column, ManyToOne, MoreThanOrEqual } from 'typeorm/browser';
import { startOfDay, addHours } from 'date-fns';
import { BaseModel } from './BaseModel';
import { IEncounter, EncounterType, ReferenceDataType } from '~/types';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('encounter')
export class Encounter extends BaseModel implements IEncounter {
  @Column({ type: 'varchar' })
  encounterType: EncounterType;

  @Column()
  startDate: Date;

  @Column()
  endDate?: Date;

  @Column()
  reasonForEncounter: string;

  @ManyToOne(type => Patient, patient => patient.encounters)
  patient: Patient;

  @ReferenceDataRelation()
  department: ReferenceData;

  @ReferenceDataRelation()
  location: ReferenceData;

  static async getOrCreateCurrentEncounter(
    patientId: string, createdEncounterOptions: any,
  ): Promise<Encounter> {
    const repo = this.getRepository();
    const timeOffset = 3;
    const date = addHours(startOfDay(new Date()), timeOffset);

    const found = await repo.findOne({
      patient: patientId,
      startDate: MoreThanOrEqual(date),
    });

    if (found) return found;

    return Encounter.create({
      patient: patientId,
      startDate: new Date(),
      endDate: null,
      encounterType: EncounterType.Clinic,
      reasonForEncounter: '',
      department: await ReferenceData.getAnyOfType(ReferenceDataType.Department),
      location: await ReferenceData.getAnyOfType(ReferenceDataType.Location),
      ...createdEncounterOptions,
    });
  }

  static async getForPatient(patientId: string): Promise<Encounter[]> {
    const repo = this.getRepository();

    return repo.find({
      patient: patientId,
    });
  }

  // TODO: add examiner
}
