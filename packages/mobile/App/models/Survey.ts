import { VitalsDataElements } from '/helpers/constants';
import { PureAbility } from '@casl/ability';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm/browser';
import { In } from 'typeorm/browser';
import { Database } from '~/infra/db';
import { ISurvey, ISurveyScreenComponent, IVitalsSurvey, SurveyTypes } from '~/types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { BaseModel } from './BaseModel';
import { Program } from './Program';
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

  getComponents(options: { includeAllVitals?: boolean } = {}): Promise<ISurveyScreenComponent[]> {
    const where = {
      survey: {
        id: this.id,
      },
    };

    const { includeAllVitals } = options;

    const repo = Database.models.SurveyScreenComponent.getRepository();
    return repo.find({
      where,
      relations: ['dataElement'],
      order: {
        screenIndex: 'ASC',
        componentIndex: 'ASC',
      },
      withDeleted: includeAllVitals,
    });
  }

  // Used for filtering lists of submittable surveys
  shouldShowInList(ability: PureAbility): boolean {
    if (this.programId === 'program-hidden_forms') return false;
    return ability.can('submit', this);
  }

  static async getVitalsSurvey({
    includeAllVitals = true,
  }: {
    includeAllVitals?: boolean;
  }): Promise<IVitalsSurvey | null> {
    const surveyRepo = Database.models.Survey.getRepository();
    const vitalsSurvey = await surveyRepo.findOne({ where: { surveyType: SurveyTypes.Vitals } });
    if (!vitalsSurvey) {
      return null;
    }

    const components = await vitalsSurvey.getComponents({ includeAllVitals });

    return {
      dateComponent: components.find(c => c.dataElementId === VitalsDataElements.dateRecorded),
      components,
      name: vitalsSurvey.name,
      id: vitalsSurvey.id,
      programId: vitalsSurvey.programId,
    };
  }
}
