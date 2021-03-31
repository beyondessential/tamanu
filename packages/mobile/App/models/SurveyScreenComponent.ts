import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';

import { Survey } from './Survey';
import { ProgramDataElement } from './ProgramDataElement';
import { ISurveyScreenComponent } from '~/types';

@Entity('survey_screen_component')
export class SurveyScreenComponent extends BaseModel
  implements ISurveyScreenComponent {
  required: boolean;

  @Column({ type: 'int', default: 0 })
  screenIndex: number;

  @Column({ type: 'int', default: 0 })
  componentIndex: number;

  @Column({ nullable: true })
  text?: string;

  @Column({ nullable: true })
  visibilityCriteria?: string;

  @Column({ nullable: true })
  validationCriteria?: string;

  @Column({ nullable: true })
  detail?: string;

  @Column({ nullable: true })
  config?: string;

  @Column({ nullable: true, type: "text" })
  options?: string;

  @ManyToOne(() => Survey, survey => survey.components)
  survey: Survey;

  @RelationId(({ survey }) => survey)
  surveyId: string;

  @ManyToOne(() => ProgramDataElement)
  dataElement: ProgramDataElement;

  @Column({ nullable: true })
  calculation?: string;

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

  getConfigObject(): any {
    if (!this.config) return {};

    return JSON.parse(this.config);
  }
}
