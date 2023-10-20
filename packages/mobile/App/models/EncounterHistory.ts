import { Column, Entity, ManyToOne, RelationId } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { EncounterType } from '~/types';
import { Encounter } from './Encounter';
import { User } from './User';
import { Department } from './Department';
import { Location } from './Location';
import { SYNC_DIRECTIONS } from './types';
import { DateTimeStringColumn } from './DateColumns';
import { getCurrentDateTimeString } from '~/ui/helpers/date';

export enum EncounterChangeType {
  EncounterType = 'encounter_type',
  Location = 'location',
  Department = 'department',
  Examiner = 'examiner',
}

@Entity('encounter_history')
export class EncounterHistory extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @DateTimeStringColumn({ nullable: false })
  date?: string;

  @ManyToOne(
    () => Encounter,
    encounter => encounter.encounterHistory,
  )
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

  @Column({ type: 'varchar', nullable: true })
  changeType?: EncounterChangeType;

  static async createSnapshot(encounter) {
    return EncounterHistory.createAndSaveOne({
      encounter: encounter.id,
      encounterType: encounter.encounterType,
      location: encounter.location,
      department: encounter.department,
      examiner: encounter.examiner,
      actor: encounter.examiner,
      date: getCurrentDateTimeString(),
    });
  }

  static getTableNameForSync(): string {
    return 'encounter_history';
  }
}
