import type { Discharge } from './Discharge';
import type { Location } from './Location';
import { Model } from './Model';
import type { Patient } from './Patient';

export class Encounter extends Model {
  id!: string;
  patientId?: string;
  locationId?: string;
  location?: Location;
  facilityId?: string;
  patient?: Patient;
  discharge?: Discharge;
  encounterType?: string;
  startDate!: string;
  endDate?: string;
}
