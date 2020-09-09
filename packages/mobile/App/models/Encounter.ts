import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IEncounter, EncounterType } from '~/types';
import { Patient } from './Patient';

@Entity('encounter')
export class Encounter extends BaseModel implements IEncounter {
  patientId: string;

  departmentId: string;

  locationId: string;

  examinerId: string;

  surveyResponses: any[];

  @Column()
  encounterType: EncounterType;

  @Column()
  startDate: Date;

  @Column()
  endDate?: Date;

  @Column()
  reasonForEncounter: string;

  @ManyToOne(
    type => Patient,
    patient => patient.encounters,
  )
  patient: Patient;

  // other FKs TODO: examiner, department, location
}
