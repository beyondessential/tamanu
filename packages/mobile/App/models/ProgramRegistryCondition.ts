import { Entity, ManyToOne, RelationId, Column, OneToMany } from 'typeorm/browser';

import { IProgramRegistryCondition } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { LabTestPanel } from './LabTestPanel';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Program } from './Program';

@Entity('program_registry_condition')
export class ProgramRegistryCondition extends BaseModel implements IProgramRegistryCondition {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;


}
