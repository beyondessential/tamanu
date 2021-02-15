import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Program } from './Program';
import { Database } from '~/infra/db';

import { ISurvey, ISurveyResponse } from '~/types';

@Entity('survey')
export class Survey extends BaseModel implements ISurvey {
  programId: string;

  responses: any[];

  @Column()
  name: string;

  @ManyToOne(() => Program, program => program.surveys)
  program: Program;

  components: any;

  getComponents(): Promise<BaseModel[]> {
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

