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
import { Setting } from './Setting';
import { CAN_ACCESS_ALL_FACILITIES, SYSTEM_USER_UUID } from '~/constants';
import { Facility } from './Facility';
import { type PureAbility } from '@casl/ability';
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
  visibilityStatus: string;

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

  /**
   * Check if user can access a specific facility based on the configuration
   *
   * Access rules:
   * 1. Superusers can always access all facilities
   * 2. [login Facility] permission overrides any linked facilities UNLESS the facility is sensitive
   * 3. If restrictUsersToFacilities is enabled OR facility is sensitive: check against user's linked facilities
   * 4. Otherwise: allow access (no restrictions)
   */
  async canAccessFacility(id: string, ability: PureAbility) {
    const facility = await Facility.getRepository().findOne({ where: { id } });
    if (!facility) throw new Error(`Facility with id ${id} not found`);

    const userLinkedFacilities = await this.allowedFacilityIds();

    // Superuser bypasses all restrictions
    if (userLinkedFacilities === CAN_ACCESS_ALL_FACILITIES) return true;

    // User is specifically linked to this facility so allow access
    const userIsLinkedToThisFacility = userLinkedFacilities.includes(id);
    if (userIsLinkedToThisFacility) return true;

    // The facility is sensitive and the user is not linked to it so deny access
    if (facility.isSensitive) return false;

    // The facility is not sensitive and the user has login permission
    if (ability.can('login', 'Facility')) return true;

    // The setting is enabled and the user is not linked to this facility so deny access
    const restrictUsersToFacilities = await Setting.getByKey('auth.restrictUsersToFacilities');
    if (restrictUsersToFacilities) return false;

    // No restrictions apply since the setting is disabled and the facility is not sensitive
    return true;
  }

  static excludedSyncColumns: string[] = [...BaseModel.excludedSyncColumns, 'localPassword'];
}
