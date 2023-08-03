import { Role } from '../ApiFactory.js';
import { Activity } from '../board/Activity.js';

export class AdmitPatient extends Activity {
  #patientId?: string;
  #admissionType?: 'hospital' | 'clinic';

  async gather({
    patientId,
    admissionType,
  }: { patientId: string; admissionType: 'hospital' | 'clinic' }): Promise<void> {
    this.#patientId = patientId;
    this.#admissionType = admissionType;
  }

  async act(role: Role): Promise<void> {
    const api = this.context.api.as(role);
    // await createEncounter(newEncounter);
    // if (referral) {
    //   await api.put(`referral/${referral.id}`, { status: REFERRAL_STATUSES.COMPLETED });
    // }
  }
}
