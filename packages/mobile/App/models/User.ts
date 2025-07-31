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
import { union } from 'lodash';
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

  async allowedFacilityIds(ability: PureAbility) {
    const canAccessAllFacilities = this.isSuperUser();
    if (canAccessAllFacilities) {
      return CAN_ACCESS_ALL_FACILITIES;
    }

    const restrictUsersToFacilities = await Setting.get('auth.restrictUsersToFacilities');
    const hasLoginPermission = ability.can('login', 'Facility');

    // Get user's linked facilities (including sensitive ones)
    const userFacilities = await UserFacility.getRepository().find({
      where: {
        user: { id: this.id },
      },
    });
    const userLinkedFacilityIds = userFacilities.map(f => f.facilityId);

    // If restrictions are disabled or user has login permission, combine linked facilities with all non-sensitive ones
    if (!restrictUsersToFacilities || hasLoginPermission) {
      const allNonSensitiveFacilities = await Facility.getRepository().find({
        where: { isSensitive: false },
        select: ['id'],
      });
      const allNonSensitiveFacilityIds = allNonSensitiveFacilities.map(f => f.id);

      // Combine and deduplicate facility IDs
      const combinedFacilityIds = union(userLinkedFacilityIds, allNonSensitiveFacilityIds);

      return combinedFacilityIds;
    }

    // Otherwise return only the facilities the user is linked to (including sensitive ones)
    return userLinkedFacilityIds;
  }

  /**
   * Check if user can access a specific facility based on the configuration
   *
   * Access rules:
   * 1. Superusers can always access all facilities
   * 2. Users can access facilities they are linked to (including sensitive ones)
   * 3. Users can access non-sensitive facilities when restrictions are disabled or they have login permission
   * 4. Otherwise: deny access
   */
  async canAccessFacility(id: string, ability: PureAbility) {
    const facility = await Facility.getRepository().findOne({ where: { id } });
    if (!facility) throw new Error(`Facility with id ${id} not found`);

    const userLinkedFacilities = await this.allowedFacilityIds(ability);

    // Superuser bypasses all restrictions
    if (userLinkedFacilities === CAN_ACCESS_ALL_FACILITIES) return true;

    // Check if user is linked to this facility
    const isUserLinked = userLinkedFacilities.includes(id);
    if (isUserLinked) return true;

    // User is not linked to the facility
    // Deny access if facility is sensitive
    if (facility.isSensitive) return false;

    // Allow access for non-sensitive facilities when no restrictions apply
    return true;
  }

  static excludedSyncColumns: string[] = [...BaseModel.excludedSyncColumns, 'localPassword'];
}
