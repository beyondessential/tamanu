import type { Facility } from './Facility';
import { Model } from './Model';

export class LocationGroup extends Model {
  name!: string;
  facilityId?: string;
  facility?: Facility;
}
