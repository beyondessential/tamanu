import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Program } from './Program';

@Entity('survey')
export class Survey extends BaseModel {

  @Column()
  name: string;

  @ManyToOne(type => Program, program => program.surveys)
  program: Program;
}

@Entity('program_data_element')
export class ProgramDataElement extends BaseModel {

  @Column()
  code: string;

  @Column()
  name: string;

  @Column()
  indicator: string;

  @Column()
  defaultText: string;

  @Column()
  defaultOptions: string;

  @Column()
  type: string;
}

@Entity('survey_screen_component')
export class SurveyScreenComponent extends BaseModel {

  @Column("int")
  screenIndex: number;

  @Column("int")
  componentIndex: number;

  @Column()
  text: string;

  @Column()
  visibilityCriteria: string;

  @Column()
  options: string;

  @ManyToOne(type => Survey, survey => survey.components)
  survey: Survey;

  @ManyToOne(type => ProgramDataElement)
  dataElement: ProgramDataElement;
}
