import { Nurse } from '../players/Nurse.js';
import { TakeVitals } from './TakeVitals.js';
import { Activity, Player, Role, chance } from './prelude.js';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

export class AdmitPatient extends Activity {
  #patientId?: string;
  #encounterType?: string;
  #encounterId?: string;
  #examinerId?: string;
  #departmentId?: string;
  #locationId?: string;

  async gather(role: Role, {
    patientId,
    admissionType,
  }: { patientId: string; admissionType: 'hospital' | 'clinic' }): Promise<void> {
    this.#patientId = patientId;
    this.#encounterType =
      admissionType === 'hospital' ? ENCOUNTER_TYPES.ADMISSION : ENCOUNTER_TYPES.CLINIC;

    const api = await this.context.api.as(role);
    this.#examinerId = api.user?.id;

    const departments: { id: string }[] = await api.get('suggestions/department');
    const department = chance.pickone(departments);
    this.#departmentId = department.id;

    const locations: { id: string }[] = await api.get('suggestions/location');
    const location = chance.pickone(locations);
    this.#locationId = location.id;
  }

  async act(role: Role): Promise<void> {
    const api = await this.context.api.as(role);
    const { id } = await api.post('encounter', {
      patientId: this.#patientId,
      encounterType: this.#encounterType,
      startDate: new Date().toISOString(),
      reasonForEncounter: chance.sentence(),
      deviceId: this.context.api.deviceId,
      examinerId: this.#examinerId,
      departmentId: this.#departmentId,
      locationId: this.#locationId,
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
