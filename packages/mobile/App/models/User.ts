import { Entity, Column, Index } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IUser } from '~/types';

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

  static excludedSyncColumns: string[] = [
    ...BaseModel.excludedSyncColumns,
    'localPassword',
  ];
}
