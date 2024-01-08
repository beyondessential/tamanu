import { Column, Entity, OneToMany, OneToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { DataElementType, IProgramDataElement } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { SurveyScreenComponent } from './SurveyScreenComponent';

@Entity('program_data_element')
export class ProgramDataElement extends BaseModel implements IProgramDataElement {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: true })
  code?: string;

  @Column({ default: '', nullable: true })
  name?: string;

  @Column({ default: '', nullable: true })
  defaultText?: string;

  @Column({ nullable: true })
  defaultOptions?: string;

  @Column('text')
  type: DataElementType;

  @OneToMany(
    () => SurveyResponseAnswer,
    answer => answer.dataElement,
  )
  answers: SurveyResponseAnswer[];

  @OneToOne(
    () => SurveyScreenComponent,
    surveyScreenComponent => surveyScreenComponent.dataElement,
  )
  surveyScreenComponent: SurveyScreenComponent;
}
