import { Entity, Column, Index, OneToMany } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { Referral } from './Referral';
import { IUser } from '~/types';
import { LabRequest } from './LabRequest';

@Entity('user')
export class User extends BaseModel implements IUser {
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

  static excludedSyncColumns: string[] = [
    ...BaseModel.excludedSyncColumns,
    'localPassword',
  ];
}
