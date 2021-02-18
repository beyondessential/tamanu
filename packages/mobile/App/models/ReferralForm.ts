import { Entity, Column, OneToMany } from 'typeorm/browser';
import { BaseModel } from './BaseModel';

import { IReferralForm, IReferralQuestion } from '~/types';
import { ReferralQuestion } from './ReferralQuestion';

@Entity('referral_form')
export class ReferralForm extends BaseModel implements IReferralForm {
  @Column()
  title: string;

  @OneToMany(() => ReferralQuestion, referralQuestion => referralQuestion.referralForm)
  questions: ReferralQuestion[];

  static async getQuestions(referralFormId: string): Promise<IReferralQuestion[]> {
    const questions = await ReferralQuestion.getRepository().find({
      where: {
        referralForm: { id: referralFormId },
      },
    });

    return questions;
  }
}
