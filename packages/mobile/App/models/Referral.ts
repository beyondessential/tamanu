import { Entity, ManyToOne, OneToMany, RelationId, Column } from 'typeorm/browser';

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

  @Column()
  date: Date;
  
  @Column()
  formTitle: string;

  static async getAnswers(referralId: string): Promise<IReferralAnswer[]> {
    const answers = await ReferralAnswer.getRepository().find({
      where: {
        referral: { id: referralId },
      },
      relations: ['question']
    });
    return answers;
  }

  static async getForPatient(patientId: string): Promise<Referral[]> {
    const repo = this.getRepository();
    
    return repo
      .createQueryBuilder("referral")
      .leftJoinAndSelect("referral.answers", "answer")
      .leftJoinAndSelect("answer.question", "question")
      .where('referral.patientId = :patientId', { patientId })
      .getMany();
  }
}
