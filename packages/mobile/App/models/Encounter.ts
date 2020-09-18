import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IEncounter, EncounterType } from '~/types';
import { Patient } from './Patient';
import { ReferenceData } from './ReferenceData';

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

  @ManyToOne(type => ReferenceData)
  department: ReferenceData;

  @ManyToOne(type => ReferenceData)
  location: ReferenceData;

  // TODO: add examiner
}
