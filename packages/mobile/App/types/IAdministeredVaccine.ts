import { ID } from './ID';
import { IScheduledVaccine } from './IScheduledVaccine';
import { IEncounter } from './IEncounter';
import { IUser } from './IUser';
import { ILocation } from './ILocation';
import { IDepartment } from './IDepartment';
import { VaccineStatus } from '~/ui/helpers/patient';
import { INJECTION_SITE_VALUES, INJECTION_SITE_LABELS } from '@tamanu/constants';

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
