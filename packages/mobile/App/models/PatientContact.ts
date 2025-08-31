import { BeforeInsert, Column, Entity, ManyToOne, RelationId } from 'typeorm';

import { IPatientContact } from '~/types';
import { Patient } from './Patient';
import { SYNC_DIRECTIONS } from './types';
import { BaseModel } from './BaseModel';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';

@Entity('patient_contacts')
export class PatientContact extends BaseModel implements IPatientContact {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  method: string;

  // This is actually JSON
  @Column({ nullable: true })
  connectionDetails: string;

  @ManyToOne(() => Patient, (patient) => patient.contacts)
  patient: Patient;

  @RelationId(({ patient }) => patient)
  patientId: string;

  @ReferenceDataRelation()
  relationship: ReferenceData;

  @RelationId(({ relationship }) => relationship)
  relationshipId: string;

  static sanitizeRecordDataForPush(rows) {
    return rows.map((row) => {
      const sanitizedRow = {
        ...row,
      };

      // Convert connectionDetails to JSON because central server expects it to be JSON
      if (row.data.connectionDetails) {
        sanitizedRow.data.connectionDetails = JSON.parse(sanitizedRow.data.connectionDetails);
      }

      return sanitizedRow;
    });
  }

  static sanitizePulledRecord(row) {
    if (row.data.connectionDetails) {
      // Convert connectionDetails to JSON because Sqlite does not support JSON type
      row.data.connectionDetails = JSON.stringify(row.data.connectionDetails);
    }
    return row;
  }

  @BeforeInsert()
  async markPatientForSync(): Promise<void> {
    await Patient.markForSync(this.patient);
  }
}
