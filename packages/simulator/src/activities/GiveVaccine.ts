import { VACCINE_CATEGORIES, VACCINE_STATUS } from '@tamanu/constants';
import { Activity, Role, chance } from './prelude.js';

export class GiveVaccine extends Activity {
  #patientId?: string;
  #vaccineCategory?: string;
  #scheduledVaccineId?: string;
  #recorderId?: string;
  #departmentId?: string;
  #locationId?: string;

  async gather(
    role: Role,
    { patientId, vaccineCategory = VACCINE_CATEGORIES.CAMPAIGN, scheduledVaccineId }: { patientId: string; vaccineCategory: string; scheduledVaccineId?: string; },
  ): Promise<void> {
    this.#patientId = patientId;
    this.#vaccineCategory = vaccineCategory;

    const api = await this.context.api.as(role);
    this.#recorderId = api.user?.id;

    this.#scheduledVaccineId = scheduledVaccineId;

    const departments: { id: string }[] = await api.get('suggestions/department');
    const department = chance.pickone(departments);
    this.#departmentId = department.id;

    const locations: { id: string }[] = await api.get('suggestions/location');
    const location = chance.pickone(locations);
    this.#locationId = location.id;

    if (scheduledVaccineId) {
      this.#scheduledVaccineId = scheduledVaccineId;
      return;
    }

    const scheduledVaccines: { id: string }[] = await api.get('suggestions/scheduledVaccine');
    const scheduledVaccine = chance.pickone(scheduledVaccines);
    this.#scheduledVaccineId = scheduledVaccine.id;
  }

  async act(role: Role): Promise<void> {
    const api = await this.context.api.as(role);
    await api.post(`${this.#patientId}/administeredVaccine`, {
      category: this.#vaccineCategory,
      scheduledVaccineId: this.#scheduledVaccineId,
      status: VACCINE_STATUS.GIVEN,
      date: new Date().toISOString(),
      deviceId: this.context.api.deviceId,
      recorderId: this.#recorderId,
      departmentId: this.#departmentId,
      locationId: this.#locationId,
      givenElsewhere: false,
    });
  }
}
