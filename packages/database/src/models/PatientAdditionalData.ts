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

  static async getForPatient(patientId: string) {
    return this.findOne({ where: { patientId } });
  }

  static async getOrCreateForPatient(patientId: string) {
    // See if there's an existing PAD we can use
    const existing = await this.getForPatient(patientId);
    if (existing) {
      return existing;
    }

    // otherwise create a new one
    return this.create({
      patientId,
    });
  }
}
