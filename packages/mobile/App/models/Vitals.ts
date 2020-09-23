import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IVitals } from '~/types';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('vitals')
export class Vitals extends BaseModel implements IVitals {
  @Column()
  date: Date;

  @Column()
  weight: string;

  @Column()
  circumference: string;

  @Column()
  sp02: string;

  @Column()
  heartRate: string;

  @Column()
  fev: string;

  @Column()
  cholesterol: string;

  @Column()
  bloodGlucose: string;

  @Column()
  bloodPressure: string;

  @Column()
  comments: string;

  @ManyToOne(type => Patient, patient => patient.vitals)
  patient: Patient;

  @ReferenceDataRelation()
  location: ReferenceData;

  static async getForPatient(patientId: string): Promise<Vitals[]> {
    const repo = this.getRepository();

    return repo.find({
      patient: patientId,
    });
  }
}
