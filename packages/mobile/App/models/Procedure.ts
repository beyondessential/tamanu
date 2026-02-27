import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Encounter } from './Encounter';
import { ReferenceData } from './ReferenceData';
import { User } from './User';
import { Department } from './Department';
import { Location } from './Location';
import { DateTimeStringColumn, DateStringColumn } from './DateColumns';
import { SYNC_DIRECTIONS } from './types';
import { IProcedure } from '~/types/IProcedure';

@Entity('procedures')
export class Procedure extends BaseModel implements IProcedure {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @DateStringColumn({ nullable: false })
  date: string;

  @DateTimeStringColumn({ nullable: true })
  endTime?: string;

  @DateTimeStringColumn({ nullable: true })
  startTime?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'text', nullable: true })
  completedNote?: string;

  @DateTimeStringColumn({ nullable: true })
  timeIn?: string;

  @DateTimeStringColumn({ nullable: true })
  timeOut?: string;

  @ManyToOne(() => Encounter)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  @ManyToOne(() => Location)
  location: Location;
  @RelationId(({ location }) => location)
  locationId?: string;

  @ManyToOne(() => ReferenceData)
  procedureType: ReferenceData;
  @RelationId(({ procedureType }) => procedureType)
  procedureTypeId?: string;

  @ManyToOne(() => User)
  leadClinician: User;
  @RelationId(({ leadClinician }) => leadClinician)
  leadClinicianId?: string;

  @ManyToOne(() => User)
  anaesthetist: User;
  @RelationId(({ anaesthetist }) => anaesthetist)
  anaesthetistId?: string;

  @ManyToOne(() => ReferenceData)
  anaesthetic: ReferenceData;
  @RelationId(({ anaesthetic }) => anaesthetic)
  anaestheticId?: string;

  @ManyToOne(() => Department)
  department: Department;
  @RelationId(({ department }) => department)
  departmentId?: string;

  @ManyToOne(() => User)
  assistantAnaesthetist: User;
  @RelationId(({ assistantAnaesthetist }) => assistantAnaesthetist)
  assistantAnaesthetistId?: string;
}
