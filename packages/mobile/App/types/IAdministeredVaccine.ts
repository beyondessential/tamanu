import { ID } from './ID';
import { IScheduledVaccine } from './IScheduledVaccine';
import { IEncounter } from './IEncounter';

export interface IAdministeredVaccine {
  id: ID;
  location?: string;
  injectionSite?: InjectionSiteType;
  reason?: string;
  scheduledVaccine?: IScheduledVaccine | string;
  scheduledVaccineId?: string;
  encounter?: IEncounter | string;
  batch?: string;
  status: string;
  date: Date;
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
