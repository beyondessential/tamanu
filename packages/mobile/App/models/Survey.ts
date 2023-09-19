import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { PureAbility } from '@casl/ability';
import { BaseModel } from './BaseModel';
import { Program } from './Program';
import { Database } from '~/infra/db';
import { VitalsDataElements } from '/helpers/constants';
import {
  ISurvey,
  ISurveyScreenComponent,
  IVitalsSurvey,
  SurveyTypes,
} from '~/types';
import { SYNC_DIRECTIONS } from './types';

@Entity('survey')
export class Survey extends BaseModel implements ISurvey {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ type: 'varchar', default: SurveyTypes.Programs, nullable: true })
  surveyType?: SurveyTypes;

  @RelationId(({ program }) => program)
  programId: string;

  responses: any[];

  @Column({ nullable: true })
  name?: string;

  @ManyToOne(
    () => Program,
    program => program.surveys,
  )
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

  static async getVitalsSurvey(): Promise<IVitalsSurvey> {
    const surveyRepo = Database.models.Survey.getRepository();
    const vitalsSurvey = await surveyRepo.findOne({ where: { surveyType: SurveyTypes.Vitals } });

    const repo = Database.models.SurveyScreenComponent.getRepository();
    const components = await repo.find({
      where: { survey: { id: vitalsSurvey.id }, visibilityStatus: null },
      relations: ['dataElement'],
      order: { screenIndex: 'ASC', componentIndex: 'ASC' },
    });

    return {
      dateComponent: components.find(c => c.dataElementId === VitalsDataElements.dateRecorded),
      components,
      name: vitalsSurvey.name,
      id: vitalsSurvey.id,
    };
  }
}
