import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IReferralAnswer } from '~/types';
import { Referral } from './Referral';
import { ReferralQuestion } from './ReferralQuestion';

@Entity('referral_answer')
export class ReferralAnswer extends BaseModel implements IReferralAnswer {
  @ManyToOne(() => Referral, referral => referral.answers)
  referral: Referral;
  @RelationId(({ referral }) => referral)
  referralId: string;
  
  @ManyToOne(() => ReferralQuestion, referralQuestion => referralQuestion)
  question: ReferralQuestion;
  @RelationId(({ question }) => question)
  questionId: string;
  
  @Column()
  answer?: string | number;
}
