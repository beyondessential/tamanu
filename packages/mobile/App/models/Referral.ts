import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, OneToMany, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Certainty, IReferral } from '~/types';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { User } from './User';
import { SurveyResponse } from './SurveyResponse';

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

  @ManyToOne(() => User, user => user.referrals)
  practitioner: User;

  @OneToMany(type => SurveyResponse, surveyResponse => surveyResponse.referral, { nullable: true })
  surveyResponse: SurveyResponse;

  @ManyToOne(() => Patient, patient => patient.referrals)
  patient: Patient;

  @RelationId((referral: Referral) => referral.patient)
  patientId: string;

  static async getForPatient(patientId: string): Promise<Referral[]> {
    const repo = this.getRepository();

    return repo.find({
      patientId,
    });
  }
}
