import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Program } from './Program';
import { Database } from '~/infra/db';

import { ISurveyScreenComponent, ISurveyResponse } from '~/types';

@Entity('survey')
export class Survey extends BaseModel implements ISurvey {
  programId: string;

  responses: any[];

  @Column()
  name: string;

  @ManyToOne(type => Program, program => program.surveys)
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

  static async getResponses(surveyId): Promise<ISurveyResponse[]> {
    const responses = await Database.models.SurveyResponse.find({
      where: {
        survey: surveyId,
      },
      relations: ['encounter', 'survey', 'encounter.patient'],
    });
    return responses;
  }
}

