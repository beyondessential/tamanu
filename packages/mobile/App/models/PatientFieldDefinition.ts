import { Entity, Column, ManyToOne, OneToMany, RelationId } from 'typeorm/browser';

import { IPatientFieldDefinition } from '~/types';
import { BaseModel } from './BaseModel';
import { ReferenceDataRelation } from './ReferenceData';
import { PatientFieldDefinitionCategory } from './PatientFieldDefinitionCategory';
import { SYNC_DIRECTIONS } from './types';

@Entity('patient_field_definition')
export class PatientFieldDefinition extends BaseModel implements IPatientFieldDefinition {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  fieldType: string;

  @Column({ nullable: true })
  options?: string;

  @Column({ nullable: false })
  visibilityStatus: string;

  @ManyToOne(
    () => PatientFieldDefinitionCategory,
    patientFieldDefinitionCategory => patientFieldDefinitionCategory.patientFieldDefinitions,
  )
  category: PatientFieldDefinitionCategory;
  @RelationId(({ category }) => category)
  categoryId: string;

  static sanitizeRecordDataForPush(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };
      // Convert options to ARRAY because central server expects it to be ARRAY
      if (row.data.options) {
        sanitizedRow.data.options = sanitizedRow.data.options.split(',');
      }

      return sanitizedRow;
    });
  }

  static sanitizePulledRecordData(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };
      // Convert options to string because Sqlite does not support ARRAY type
      if (row.data.options) {
        sanitizedRow.data.options = sanitizedRow.data.options.join(',');
      }

      return sanitizedRow;
    });
  }

  static getTableNameForSync(): string {
    return 'patient_field_definitions';
  }
}
