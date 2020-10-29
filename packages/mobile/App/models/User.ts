import { Entity, Column } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IUser } from '~/types';

@Entity('user')
export class User extends BaseModel implements IUser {
  @Column()
  email: string; // non nullable; unique; index?

  @Column()
  localPassword: string;

  // eslint-react gets confused by displayName.
  // eslint-disable-next-line react/static-property-placement
  @Column()
  displayName: string; // non nullable

  @Column()
  role: string; // non nullable; default practitioner
}
