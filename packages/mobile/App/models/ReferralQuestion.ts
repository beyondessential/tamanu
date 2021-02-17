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

  @Column('text')
  field: FieldType;
  
  @Column('text')
  type: QuestionType;
  
  @Column({ default: 1 })
  sort: number;
  
  @Column()
  question: string;
  
  @Column()
  options?: string;
  
  @Column()
  source?: string;
}
