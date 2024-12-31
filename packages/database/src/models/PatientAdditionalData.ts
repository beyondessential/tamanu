import { Model } from './Model';

export class PatientAdditionalData extends Model {
  ethnicityId?: string;
  drivingLicense?: string;
  passportNumber?: string;
  title?: string;
  primaryContactNumber?: string;
  secondaryContactNumber?: string;
  cityTown?: string;
  streetVillage?: string;
}
