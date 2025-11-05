import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { EncounterType } from '~/types';
import { Encounter } from './Encounter';
import { User } from './User';
import { Department } from './Department';
import { Location } from './Location';
import { SYNC_DIRECTIONS } from './types';
import { DateTimeStringColumn } from './DateColumns';
import { getCurrentDateTimeString } from '~/ui/helpers/date';

export const EncounterChangeType = {
  EncounterType: 'encounter_type',
  Location: 'location',
  Department: 'department',
  Examiner: 'examiner',
} as const;

export type EncounterChangeType = (typeof EncounterChangeType)[keyof typeof EncounterChangeType];

@Entity('encounter_history')
export class EncounterHistory extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @DateTimeStringColumn({ nullable: false })
  date?: string;

  @ManyToOne(() => Encounter, encounter => encounter.encounterHistories)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @ManyToOne(() => Location)
  location: Location;

  @RelationId(({ location }) => location)
  locationId: string;

  @ManyToOne(() => Department)
  department: Department;

  @RelationId(({ department }) => department)
  departmentId: string;

  @ManyToOne(() => User)
  examiner: User;

  @RelationId(({ examiner }) => examiner)
  examinerId: string;

  @ManyToOne(() => User)
  actor: User;

  @RelationId(({ actor }) => actor)
  actorId: string;

  @Column({ type: 'varchar', nullable: false })
  encounterType: EncounterType;

  @Column({ nullable: true })
  changeType?: string;

  static sanitizeRecordDataForPush(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };
      // Convert changeType to ARRAY because central server expects it to be ARRAY
      if (typeof row.data?.changeType === 'string') {
        // Handle empty string (from empty array) by converting to empty array
        sanitizedRow.data.changeType =
          row.data.changeType === '' ? [] : row.data.changeType.split(',');
      }

      return sanitizedRow;
    });
  }

  static sanitizePulledRecordData(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };
      // Convert changeType to string because Sqlite does not support ARRAY type
      if (row.data?.changeType && Array.isArray(row.data.changeType)) {
        sanitizedRow.data.changeType = row.data.changeType.join(',');
      }

      return sanitizedRow;
    });
  }

  static async createSnapshot(encounter, { date }) {
    return EncounterHistory.createAndSaveOne({
      encounter: encounter.id,
      encounterType: encounter.encounterType,
      location: encounter.location,
      department: encounter.department,
      examiner: encounter.examiner,
      actor: encounter.examiner,
      date: date || getCurrentDateTimeString(),
    });
  }
}
