import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

import { IPatientFieldDefinition } from '~/types';
import { BaseModel } from './BaseModel';
import { PatientFieldDefinitionCategory } from './PatientFieldDefinitionCategory';
import { SYNC_DIRECTIONS } from './types';

@Entity('patient_field_definitions')
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
    (patientFieldDefinitionCategory) => patientFieldDefinitionCategory.patientFieldDefinitions,
  )
  category: PatientFieldDefinitionCategory;
  @RelationId(({ category }) => category)
  categoryId: string;

  static sanitizeRecordDataForPush(rows) {
    return rows.map((row) => {
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

  static sanitizePulledRecord(row) {
    if (row.data.options) {
      // Convert options to string because Sqlite does not support ARRAY type
      row.data.options = row.data.options.join(',');
    }

    return row;
  }
}
