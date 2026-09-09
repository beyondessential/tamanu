import { Column, Entity } from 'typeorm';

import type { IPatientFieldDefinitionCategory } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

@Entity('patient_field_definition_categories')
export class PatientFieldDefinitionCategory
  extends BaseModel
  implements IPatientFieldDefinitionCategory
{
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: false })
  name: string;
}
