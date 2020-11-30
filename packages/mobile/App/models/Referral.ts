import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, OneToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Certainty, IReferral } from '~/types';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { User } from './User';

@Entity('referral')
export class Referral extends BaseModel implements IReferral {
  @PrimaryGeneratedColumn('uuid')
  referralNumber: string;

  @Column()
  referredFacility: string;

  @Column()
  referredDepartment: string;

  @Column()
  date: Date;

  @Column()
  notes: string;

  @Column({ type: 'varchar' })
  certainty: Certainty;

  @ReferenceDataRelation()
  diagnosis: ReferenceData;

  @OneToOne(type => User, user => user.referral)
  practitioner: User;

  @ManyToOne(type => Patient, patient => patient.referral)
  patient: Patient;

  static async getForPatient(patientId: string): Promise<Referral[]> {
    const repo = this.getRepository();

    return repo.find({
      patient: patientId,
    });
  }
}
