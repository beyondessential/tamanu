import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';

import { Survey } from './Survey';
import { ProgramDataElement } from './ProgramDataElement';
import { ISurveyScreenComponent, SurveyScreenValidationCriteria } from '~/types';
import { SYNC_DIRECTIONS } from './types';

@Entity('survey_screen_component')
export class SurveyScreenComponent extends BaseModel implements ISurveyScreenComponent {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  required: boolean;

  @Column({ type: 'int', nullable: true })
  screenIndex?: number;

  @Column({ type: 'int', nullable: true })
  componentIndex?: number;

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

  @Column({ nullable: true, type: 'text' })
  options?: string;

  @ManyToOne(
    () => Survey,
    survey => survey.components,
  )
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
      const optionString = this.options || this.dataElement.defaultOptions || '';
      if (!optionString) {
        return [];
      }
      const optionArray = JSON.parse(optionString);
      return Object.entries(optionArray).map(([label, value]) => ({ label, value }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  getConfigObject(): any {
    if (!this.config) return {};

    try {
      return JSON.parse(this.config);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid config in survey screen component ${this.id}`);
      return {};
    }
  }

  getValidationCriteriaObject(): SurveyScreenValidationCriteria {
    if (!this.validationCriteria) return {};

    try {
      return JSON.parse(this.validationCriteria);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid validationCriteria in survey screen component ${this.id}`);
      return {};
    }
  }
}
