import { IMAGING_REQUEST_STATUS_TYPES, type IMAGING_TYPES_VALUES } from '@tamanu/constants';
import type { Encounter } from './Encounter';
import type { ImagingRequestArea } from './ImagingRequestArea';
import { Model } from './Model';
import type { User } from './User';
import type { Note } from './Note';
import type { Location } from './Location';
import type { LocationGroup } from './LocationGroup';

const ALL_IMAGING_REQUEST_STATUS_TYPES = Object.values(IMAGING_REQUEST_STATUS_TYPES);

export class ImagingRequest extends Model {
  areas!: ImagingRequestArea[];
  displayId!: string;
  priority?: string;
  encounter?: Encounter;
  requestedBy?: User;
  requestedDate?: string;
  imagingType!: (typeof IMAGING_TYPES_VALUES)[number];
  status!: (typeof ALL_IMAGING_REQUEST_STATUS_TYPES)[number];
  notes!: Note[];
  location?: Location;
  locationGroup?: LocationGroup;
}
