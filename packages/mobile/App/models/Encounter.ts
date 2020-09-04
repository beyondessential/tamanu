import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IEncounter } from '~/types';
import { Patient } from './Patient';

@Entity('encounter')
export class Encounter extends BaseModel implements IEncounter {
  
  @Column()
  encounterType: string;

  @Column()
  startDate: Date;

  @Column()
  endDate?: Date;

  @Column()
  reasonForEncounter: string;
  
  @ManyToOne(type => Patient, patient => patient.encounters)
  patient: Patient;
  
  // other FKs TODO: examiner, department, location
}
