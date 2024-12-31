import { Model } from './Model';
import type { ReferenceData } from './ReferenceData';

export class ScheduledVaccine extends Model {
  doseLabel?: string;
  vaccine?: ReferenceData;
}
