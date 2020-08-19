import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';

@Entity('encounter')
export class Encounter extends BaseModel {
  
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
