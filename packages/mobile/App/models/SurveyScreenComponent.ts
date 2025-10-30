import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';

import { Survey } from './Survey';
import { ProgramDataElement } from './ProgramDataElement';
import { ISurveyScreenComponent, SurveyScreenValidationCriteria } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';

@Entity('survey_screen_components')
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

  @ManyToOne(() => Survey, (survey) => survey.components)
  survey: Survey;

  @RelationId(({ survey }) => survey)
  surveyId: string;

  @ManyToOne(() => ProgramDataElement)
  dataElement: ProgramDataElement;

  @Column({ nullable: true })
  calculation?: string;

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: string;

  @RelationId(({ dataElement }) => dataElement)
  dataElementId: string;

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
