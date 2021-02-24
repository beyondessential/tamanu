import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { FieldType, IReferralQuestion, QuestionType } from '~/types';
import { ReferralForm } from './ReferralForm';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';

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
  order: number;
  
  @Column()
  question: string;
  
  @Column({ nullable: true })
  options?: string;
  
  @Column({ nullable: true })
  source?: string;

  static async getLatetSurveyAnswerForQuestion(patientId: string, dataElementId: string): Promise<SurveyResponseAnswer> {
    const answer = await SurveyResponseAnswer.getRepository()
      .createQueryBuilder('survey_response_answer')
      .innerJoinAndSelect('survey_response_answer.response', 'response')
      .innerJoinAndSelect('response.encounter', 'encounter')
      .where('encounter.patientId = :patientId', { patientId })
      .andWhere('survey_response_answer.dataElementId = :dataElementId', { dataElementId })
      .orderBy('survey_response_answer.createdAt', 'DESC')
      .getOne();
      
    return answer;
  }
}
