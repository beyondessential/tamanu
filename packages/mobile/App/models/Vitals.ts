import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { AVPUType, IVitals } from '~/types';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('vitals')
export class Vitals extends BaseModel implements IVitals {
  @Column()
  date: Date;

  @Column('int')
  weight: number;

  @Column('int')
  height: number;

  @Column('int')
  sbp: number;

  @Column('int')
  dbp: number;

  @Column('int')
  heartRate: number;

  @Column('int')
  respiratoryRate: number;

  @Column('int')
  temperature: number;

  @Column('int')
  svO2: number;

  @Column({ type: 'varchar' })
  avpu: AVPUType;

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
