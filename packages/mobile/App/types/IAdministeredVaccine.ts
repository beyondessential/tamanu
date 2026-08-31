import type { ID } from './ID';
import type { IScheduledVaccine } from './IScheduledVaccine';
import type { IEncounter } from './IEncounter';
import type { IUser } from './IUser';
import type { ILocation } from './ILocation';
import type { IDepartment } from './IDepartment';
import type { VaccineStatus } from '~/ui/helpers/patient';
import { type INJECTION_SITE_VALUES, INJECTION_SITE_LABELS } from '@tamanu/constants';

export interface IAdministeredVaccine {
  id: ID;
  location?: ILocation | string;
  locationId?: string;
  department?: IDepartment | string;
  departmentId?: string;
  injectionSite?: InjectionSiteType;
  reason?: string;
  scheduledVaccine?: IScheduledVaccine | string;
  scheduledVaccineId?: string;
  givenBy?: string;
  recorder?: IUser | string;
  recorderId?: string;
  encounter?: IEncounter | string;
  batch?: string;
  status: VaccineStatus;
  date: string;
  notGivenReasonId?: string;
}

export type InjectionSiteType = (typeof INJECTION_SITE_VALUES)[keyof typeof INJECTION_SITE_VALUES];

export const INJECTION_SITE_OPTIONS = Object.entries(INJECTION_SITE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
