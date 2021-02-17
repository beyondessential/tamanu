import { Entity, ManyToOne, OneToMany, RelationId } from 'typeorm/browser';

import { IReferral, IReferralAnswer } from '~/types';

import { BaseModel } from './BaseModel';
import { Patient } from './Patient';
import { ReferralAnswer } from './ReferralAnswer';

@Entity('referral')
export class Referral extends BaseModel implements IReferral {
  @ManyToOne(() => Patient, patient => patient.referrals)
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  @OneToMany(() => ReferralAnswer, referralAnswer => referralAnswer.referral)
  answers: ReferralAnswer[];

  static async getAnswers(referralId: string): Promise<IReferralAnswer[]> {
    const answers = await ReferralAnswer.find({
      where: {
        referral: { id: referralId },
      },
      relations: ['question'],
    });
    return answers;
  }

  static async getForPatient(patientId: string): Promise<Referral[]> {
    const repo = this.getRepository();

    return repo.find({
      patientId,
    });
  }
}
