import { Entity, Column, Index, OneToMany } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Referral } from './Referral';
import { IUser, INoteItem } from '~/types';
import { AdministeredVaccine } from './AdministeredVaccine';
import { NoteItem } from './NoteItem';
import { LabRequest } from './LabRequest';
import { VitalLog } from './VitalLog';
import { SYNC_DIRECTIONS } from './types';

@Entity('user')
export class User extends BaseModel implements IUser {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  localPassword?: string;

  // eslint-react gets confused by displayName.
  // eslint-disable-next-line react/static-property-placement
  @Column()
  displayName: string;

  @Column()
  role: string;

  @OneToMany(() => Referral, (referral) => referral.practitioner)
  referrals: Referral[];

  @OneToMany(() => LabRequest, (labRequest) => labRequest.requestedBy)
  labRequests: LabRequest[];

  @OneToMany(() => LabRequest, (labRequest) => labRequest.collectedBy)
  collectedLabRequests: LabRequest[];

  @OneToMany(() => AdministeredVaccine, (administeredVaccine) => administeredVaccine.recorder)
  recordedVaccines: AdministeredVaccine[];

  @OneToMany(() => NoteItem, noteItem => noteItem.author)
  authoredNoteItems: NoteItem[];

  @OneToMany(() => NoteItem, noteItem => noteItem.onBehalfOf)
  onBehalfOfNoteItems: NoteItem[];

  @OneToMany(() => VitalLog, vitalLog => vitalLog.recordedBy)
  recordedVitalLogs: VitalLog[];

  static excludedSyncColumns: string[] = [...BaseModel.excludedSyncColumns, 'localPassword'];
}
