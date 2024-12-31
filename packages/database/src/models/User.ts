import { Model } from './Model';

export class User extends Model {
  displayId?: string;
  displayName!: string;
  email!: string;
}
