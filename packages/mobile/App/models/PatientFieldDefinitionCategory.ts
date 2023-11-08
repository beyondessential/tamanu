import { Entity, Column, OneToMany } from 'typeorm/browser';

import { IPatientFieldDefinitionCategory } from '~/types';
import { BaseModel } from './BaseModel';
import { ReferenceDataRelation } from './ReferenceData';
import { SYNC_DIRECTIONS } from './types';


@Entity('patient_field_definition_category')
export class PatientFieldDefinitionCategory extends BaseModel implements IPatientFieldDefinitionCategory {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: false })
  name: string;

  static getTableNameForSync(): string {
    return 'patient_field_definition_categories';
  }
}
