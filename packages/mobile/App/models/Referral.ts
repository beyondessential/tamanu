import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IReferral } from '~/types';
import { Diagnosis } from './Diagnosis';
import { Patient } from './Patient';

@Entity('referral')
export class Referral extends BaseModel implements IReferral {
  @Column()
  referralNumber: string;

  @Column()
  date: Date;

  @Column()
  referredTo: string;

  @ManyToOne(type => Patient, patient => patient.referral)
  patient: Patient;

  @ManyToOne(type => Diagnosis, diagnosis => diagnosis.referral)
  diagnosis: Diagnosis;
}
