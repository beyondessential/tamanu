import { ID } from './ID';
import { IScheduledVaccine } from './IScheduledVaccine';
import { IEncounter } from './IEncounter';
import { IUser } from './IUser';
import { ILocation } from './ILocation';
import { IDepartment } from './IDepartment';
import { VaccineStatus } from '~/ui/helpers/patient';

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
}

export enum InjectionSiteType {
  LeftArm = 'Left arm',
  RightArm = 'Right arm',
  LeftThigh = 'Left thigh',
  RightThigh = 'Right thigh',
  Oral = 'Oral',
  Other = 'Other',
}

export const INJECTION_SITE_OPTIONS = Object.keys(InjectionSiteType).map(k => InjectionSiteType[k as string] as InjectionSiteType);
