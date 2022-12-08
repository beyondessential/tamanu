import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { PureAbility } from '@casl/ability';
import { BaseModel } from './BaseModel';
import { Program } from './Program';
import { Database } from '~/infra/db';

import { ISurvey, ISurveyResponse, ISurveyScreenComponent, SurveyTypes } from '~/types';

@Entity('survey')
export class Survey extends BaseModel implements ISurvey {
  @Column({ type: 'varchar', default: SurveyTypes.Programs, nullable: true })
  surveyType?: SurveyTypes;

  @RelationId(({ program }) => program)
  programId: string;

  responses: any[];

  @Column({ nullable: true })
  name?: string;

  @ManyToOne(() => Program, program => program.surveys)
  program: Program;

  components: any;

  @Column({ nullable: false, default: false })
  isSensitive: boolean;

  getComponents(): Promise<ISurveyScreenComponent[]> {
    const repo = Database.models.SurveyScreenComponent.getRepository();
    return repo.find({
      where: { survey: { id: this.id } },
      relations: ['dataElement'],
      order: { screenIndex: 'ASC', componentIndex: 'ASC' },
    });
  }

  // Used for filtering lists of submittable surveys
  shouldShowInList(ability: PureAbility): boolean {
    if (this.programId === 'program-hidden_forms') return false;
    return ability.can('submit', this);
  }

  static async getResponses(
    surveyId: string,
    patientId?: string
  ): Promise<ISurveyResponse[]> {
    const patientFilter = patientId
      ? { encounter: { patient: { id: patientId } } }
      : {};
    const responses = await Database.models.SurveyResponse.find({
      where: {
        survey: surveyId,
        ...patientFilter,
      },
      relations: ['encounter', 'survey', 'encounter.patient'],
    });
    return responses;
  }
}
