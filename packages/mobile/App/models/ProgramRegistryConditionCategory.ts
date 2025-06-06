import { Entity, ManyToOne, RelationId, Column } from 'typeorm';

import { ID, IProgramRegistry, IProgramRegistryCategory } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '~/visibilityStatuses';
import { ProgramRegistry } from './ProgramRegistry';

@Entity('program_registry_condition_categories')
export class ProgramRegistryConditionCategory
  extends BaseModel
  implements IProgramRegistryCategory
{
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: false, unique: true })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'varchar', default: VisibilityStatus.Current, nullable: true })
  visibilityStatus?: VisibilityStatus;

  @ManyToOne(() => ProgramRegistry)
  programRegistry: IProgramRegistry;
  @RelationId(({ programRegistry }) => programRegistry)
  programRegistryId: ID;
}
