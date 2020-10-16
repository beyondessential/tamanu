import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IReferral } from '~/types';
import { Diagnosis } from './Diagnosis';
import { Patient } from './Patient';

@Entity('referral')
export class Referral extends BaseModel implements IReferral {
  @PrimaryGeneratedColumn('uuid')
  referralNumber: string;

  @Column()
  practitioner: string;

  @Column()
  referredFacility: string;

  @Column()
  referredDepartment: string;

  @Column()
  date: Date;

  @Column()
  notes: string;

  @ManyToOne(type => Patient, patient => patient.referral)
  patient: Patient;

  @ManyToOne(type => Diagnosis, diagnosis => diagnosis.referral)
  diagnosis: Diagnosis;
}
