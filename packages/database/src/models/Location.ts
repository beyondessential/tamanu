import { Model } from './Model';

export class Location extends Model {
  id!: string;
  patientId!: string;
  locationId!: string;
  facilityId!: string;
}
