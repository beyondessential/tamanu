import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';

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

  @ManyToOne(() => Survey, survey => survey.components)
  survey: Survey;

  @RelationId(({ survey }) => survey)
  surveyId: string;

  @ManyToOne(() => ProgramDataElement)
  dataElement: ProgramDataElement;

  @RelationId(({ dataElement }) => dataElement)
  dataElementId: string;

  getOptions(): any {
    try {
      const optionString = (this.options || this.dataElement.defaultOptions || '');
      if (!optionString) {
        return [];
      }
      const optionArray: string[] = JSON.parse(optionString);
      return optionArray
        .map(x => x.trim())
        .filter(x => x)
        .map(x => ({ label: x, value: x }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }
}

