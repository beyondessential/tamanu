/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-classes-per-file */
import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Program } from './Program';
import { Database } from '~/infra/db';

import { ISurveyScreenComponent, ISurvey, IProgramDataElement } from '~/types';
import { SurveyResponse } from './SurveyResponse';

@Entity('survey_screen_component')
export class SurveyScreenComponent extends BaseModel
  implements ISurveyScreenComponent {
  required: boolean;

  @Column('int')
  screenIndex: number;

  @Column('int')
  componentIndex: number;

  @Column({ nullable: true })
  text?: string;

  @Column({ nullable: true })
  visibilityCriteria?: string;

  @Column({ nullable: true })
  options?: string;

  @ManyToOne(
    type => Survey,
    survey => survey.components,
  )
  survey: Survey;

  @ManyToOne(type => ProgramDataElement)
  dataElement: ProgramDataElement;

  getOptions(): any {
    return (this.options || this.dataElement.defaultOptions || '')
      .split(',')
      .map(x => x.trim())
      .filter(x => x)
      .map(x => ({ label: x, value: x }));
  }
}

@Entity('survey')
export class Survey extends BaseModel implements ISurvey {
  programId: string;

  responses: any[];

  @Column()
  name: string;

  @ManyToOne(
    type => Program,
    program => program.surveys,
  )
  program: Program;

  components: any;

  getComponents(): Promise<BaseModel[]> {
    const repo = SurveyScreenComponent.getRepository();
    return repo.find({
      where: { survey: { id: this.id } },
      relations: ['dataElement'],
      order: { componentIndex: 'ASC' },
    });
  }

  static async getResponses(surveyId): Promise<SurveyResponse[]> {
    const responses = await Database.models.SurveyResponse.find({
      where: {
        survey: surveyId,
      },
      relations: ['encounter', 'survey', 'encounter.patient'],
    });
    return responses;
  }
}

@Entity('program_data_element')
export class ProgramDataElement extends BaseModel
  implements IProgramDataElement {
  name: string;

  @Column()
  code: string;

  @Column()
  indicator: string;

  @Column()
  defaultText: string;

  @Column({ nullable: true })
  defaultOptions?: string;

  @Column()
  type: string;
}
