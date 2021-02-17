import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { FieldType, IReferralQuestion, QuestionType } from '~/types';
import { ReferralForm } from './ReferralForm';

@Entity('referral_question')
export class ReferralQuestion extends BaseModel implements IReferralQuestion {
  @ManyToOne(() => ReferralForm, referralForm => referralForm.questions)
  referralForm: ReferralForm;
  @RelationId(({ referralForm }) => referralForm)
  referralFormId: string;

  @Column()
  field: FieldType;
  
  @Column()
  type: QuestionType;
  
  @Column()
  index: number;
  
  @Column()
  question: string;
  
  @Column()
  options?: string;
  
  @Column()
  source?: string;
}
