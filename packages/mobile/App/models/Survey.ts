import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Program } from './Program';

import { ISurveyScreenComponent, ISurvey, IProgramDataElement } from '~/types';

@Entity('survey')
export class Survey extends BaseModel implements ISurvey {

  @Column()
  name: string;

  @ManyToOne(type => Program, program => program.surveys)
  program: Program;
}

@Entity('program_data_element')
export class ProgramDataElement extends BaseModel implements IProgramDataElement {

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

@Entity('survey_screen_component')
export class SurveyScreenComponent extends BaseModel implements ISurveyScreenComponent {

  @Column("int")
  screenIndex: number;

  @Column("int")
  componentIndex: number;

  @Column({ nullable: true })
  text?: string;

  @Column({ nullable: true })
  visibilityCriteria?: string;

  @Column({ nullable: true })
  options?: string;

  @ManyToOne(type => Survey, survey => survey.components)
  survey: Survey;

  @ManyToOne(type => ProgramDataElement)
  dataElement: ProgramDataElement;
}
