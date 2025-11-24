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
import { CAN_ACCESS_ALL_FACILITIES, SYSTEM_USER_UUID } from '~/constants';
import { type PureAbility } from '@casl/ability';
import { union } from 'lodash';
import { MODELS_MAP } from './modelsMap';
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
  password?: string;

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

  async allowedFacilityIds(ability: PureAbility, models: typeof MODELS_MAP) {
    const { Facility, Setting, UserFacility } = models;
    if (this.isSuperUser()) {
      return CAN_ACCESS_ALL_FACILITIES;
    }

    const restrictUsersToFacilities = await Setting.getByKey('auth.restrictUsersToFacilities');
    // Remove facility permission check - all users can access all non-sensitive facilities
    const hasAllNonSensitiveFacilityAccess = !restrictUsersToFacilities;

    const sensitiveFacilities = await Facility.getRepository().count({
      where: { isSensitive: true },
    });
    if (hasAllNonSensitiveFacilityAccess && sensitiveFacilities === 0)
      return CAN_ACCESS_ALL_FACILITIES;

    // Get user's linked facilities (including sensitive ones)
    const explicitlyAllowedFacilities = await UserFacility.getRepository().find({
      where: {
        user: { id: this.id },
      },
    });
    const explicitlyAllowedFacilityIds = explicitlyAllowedFacilities.map(f => f.facilityId);

    if (hasAllNonSensitiveFacilityAccess) {
      // Combine any explicitly linked facilities with all non-sensitive facilities
      const allNonSensitiveFacilities = await Facility.getRepository().find({
        where: { isSensitive: false },
        select: ['id'],
      });
      const allNonSensitiveFacilityIds = allNonSensitiveFacilities.map(f => f.id);

      const combinedFacilityIds = union(explicitlyAllowedFacilityIds, allNonSensitiveFacilityIds);
      return combinedFacilityIds;
    }

    // Otherwise return only the facilities the user is linked to (including sensitive ones)
    return explicitlyAllowedFacilityIds;
  }

  async canAccessFacility(id: string, ability: PureAbility, models: typeof MODELS_MAP) {
    const userLinkedFacilities = await this.allowedFacilityIds(ability, models);
    if (userLinkedFacilities === CAN_ACCESS_ALL_FACILITIES) return true;
    return userLinkedFacilities.includes(id);
  }
}
