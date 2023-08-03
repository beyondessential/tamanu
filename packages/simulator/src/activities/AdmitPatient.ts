import { Nurse } from '../players/Nurse.js';
import { TakeVitals } from './TakeVitals.js';
import { Activity, Player, Role, chance } from './prelude.js';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

export class AdmitPatient extends Activity {
  #patientId?: string;
  #encounterType?: string;
  #encounterId?: string;

  async gather({
    patientId,
    admissionType,
  }: { patientId: string; admissionType: 'hospital' | 'clinic' }): Promise<void> {
    this.#patientId = patientId;
    this.#encounterType =
      admissionType === 'hospital' ? ENCOUNTER_TYPES.ADMISSION : ENCOUNTER_TYPES.CLINIC;
  }

  async act(role: Role): Promise<void> {
    const api = await this.context.api.as(role);
    const { id } = await api.post('encounter', {
      patientId: this.#patientId,
      encounterType: this.#encounterType,
      startDate: new Date().toISOString(),
      reasonForEncounter: chance.sentence(),
      deviceId: this.context.api.deviceId,
    });

    this.#encounterId = id;
  }

  async call(player: Player): Promise<void> {
    player.sendToOne(Nurse, TakeVitals, {
      patientId: this.#patientId,
      encounterId: this.#encounterId,
    });
  }
}
