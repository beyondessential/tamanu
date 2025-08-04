import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { BaseModel } from './BaseModel';
import { Referral } from './Referral';
import { IUser } from '~/types';
import { AdministeredVaccine } from './AdministeredVaccine';
import { Note } from './Note';
import { LabRequest } from './LabRequest';
import { VitalLog } from './VitalLog';
import { SYNC_DIRECTIONS } from './types';
import { VisibilityStatus } from '../visibilityStatuses';
import { UserFacility } from './UserFacility';
import { CAN_ACCESS_ALL_FACILITIES, SYSTEM_USER_UUID } from '~/constants';
@Entity('users')
export class User extends BaseModel implements IUser {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @PrimaryColumn()
  id: string;

  @Column()
  displayId: string;

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

  @OneToMany(() => Referral, referral => referral.practitioner)
  referrals: Referral[];

  @OneToMany(() => LabRequest, labRequest => labRequest.requestedBy)
  labRequests: LabRequest[];

  @OneToMany(() => LabRequest, labRequest => labRequest.collectedBy)
  collectedLabRequests: LabRequest[];

  @OneToMany(() => AdministeredVaccine, administeredVaccine => administeredVaccine.recorder)
  recordedVaccines: AdministeredVaccine[];

  @OneToMany(() => Note, note => note.author)
  authoredNotes: Note[];

  @OneToMany(() => Note, note => note.onBehalfOf)
  onBehalfOfNotes: Note[];

  @OneToMany(() => VitalLog, vitalLog => vitalLog.recordedBy)
  recordedVitalLogs: VitalLog[];

  @Column({ default: VisibilityStatus.Current })
  visibilityStatus: VisibilityStatus;

  isSuperUser() {
    return this.role === 'admin' || this.id === SYSTEM_USER_UUID;
  }

  async allowedFacilityIds() {
    const canAccessAllFacilities = this.isSuperUser();
    if (canAccessAllFacilities) {
      return CAN_ACCESS_ALL_FACILITIES;
    }

    const userFacilities = await UserFacility.getRepository().find({
      where: {
        user: { id: this.id },
      },
    });

    return userFacilities.map(f => f.facilityId);
  }

  async canAccessFacility(id: string) {
    const allowed = await this.allowedFacilityIds();
    if (allowed === CAN_ACCESS_ALL_FACILITIES) return true;

    return allowed.includes(id);
  }

  static excludedSyncColumns: string[] = [...BaseModel.excludedSyncColumns, 'localPassword'];
}
