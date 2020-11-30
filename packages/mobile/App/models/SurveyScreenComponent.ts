import { Entity, Column, ManyToOne } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Database } from '~/infra/db';

import { Survey } from './Survey';
import { ProgramDataElement } from './ProgramDataElement';
import { ISurveyScreenComponent } from '~/types';

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

  @ManyToOne(type => Survey, survey => survey.components)
  survey: Survey;

  @ManyToOne(type => ProgramDataElement, element => element.components)
  dataElement: ProgramDataElement;

  getOptions(): any {
    try {
      const optionString = (this.options || this.dataElement.defaultOptions || '');
      if(!optionString) {
        return [];
      }
      const optionArray = JSON.parse(optionString);
      return optionArray
        .map(x => x.trim())
        .filter(x => x)
        .map(x => ({ label: x, value: x }));
    } catch(e) {
      console.error(e);
      return [];
    }
  }
}

