import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IEncounter, EncounterType } from '~/types';
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

  static async getForPatient(patientId: string): Promise<Encounter[]> {
    const repo = this.getRepository();

    return repo.find({
      patient: patientId,
    });
  }

  // TODO: add examiner
}
