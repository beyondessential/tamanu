import type { Facility } from './Facility';
import type { LocationGroup } from './LocationGroup';
import { Model } from './Model';

export class Location extends Model {
  id!: string;
  name!: string;
  facilityId?: string;
  facility?: Facility;
  locationGroup?: LocationGroup;
}
