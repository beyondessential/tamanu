import { ID } from './ID';
import { IScheduledVaccine } from './IScheduledVaccine';

export interface IAdministeredVaccine {
  id: ID;
  location?: string;
  injectionSite?: InjectionSiteType;
  reason?: string;
  scheduledVaccine?: IScheduledVaccine;
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
