import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Program } from './Program';
import { Database } from '~/infra/db';

import { ISurvey, ISurveyResponse, ISurveyScreenComponent, SurveyTypes } from '~/types';

@Entity('survey')
export class Survey extends BaseModel implements ISurvey {
  @Column({ type: 'varchar', default: SurveyTypes.Programs, nullable: true })
  surveyType?: SurveyTypes;

  @RelationId(({ program }) => program)
  programId: string;

  responses: any[];

  @Column({ nullable: true })
  name?: string;

  @ManyToOne(() => Program, program => program.surveys)
  program: Program;

  components: any;

  getComponents(): Promise<ISurveyScreenComponent[]> {
    const repo = Database.models.SurveyScreenComponent.getRepository();
    return repo.find({
      where: { survey: { id: this.id } },
      relations: ['dataElement'],
      order: { screenIndex: 'ASC', componentIndex: 'ASC' },
    });
  }

  static async getResponses(surveyId: string): Promise<ISurveyResponse[]> {
    const responses = await Database.models.SurveyResponse.find({
      where: {
        survey: surveyId,
      },
      relations: ['encounter', 'survey', 'encounter.patient'],
    });
    return responses;
  }
}
