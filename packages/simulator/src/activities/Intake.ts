import { Nurse } from '../players/Nurse.js';
import { AdmitPatient } from './AdmitPatient.js';
import { Activity, Player, Role, chance, optionally, upto } from './prelude.js';
import { differenceInYears, formatISO } from 'date-fns';

export class Intake extends Activity {
  #newPatientIds: string[] = [];

  async act(role: Role): Promise<void> {
    const api = await this.context.api.as(role);

    for (const _ of upto(50)) {
      const dateOfBirth = chance.birthday();
      const age = differenceInYears(new Date(), dateOfBirth);
      const { id } = await api.post('patient', {
        displayId: chance.string({ length: 6, alpha: true, numeric: true }),
        firstName: chance.first(),
        middleName: chance.first(),
        lastName: chance.last(),
        culturalName: chance.name(),
        dateOfBirth: formatISO(dateOfBirth, { representation: 'date' }),
        sex: optionally('other', 1, chance.pickone(['male', 'female'])),

        // PAD
        primaryContactNumber: chance.phone(),
        maritalStatus:
          age > 18 && chance.bool({ likelihood: Math.min(age, 100) })
            ? chance.pickone(['Married', 'Single', 'Separated'])
            : null,
      });
      this.#newPatientIds.push(id);
    }
  }

  async call(player: Player): Promise<void> {
    for (const id of this.#newPatientIds) {
      // if (chance.bool({ likelihood: 10 })) {
      //   player.sendToOne(Doctor, TriagePatient, { patientId: id });
      //   return;
      // }

      player.sendToOne(Nurse, AdmitPatient, {
        patientId: id,
        admissionType: chance.bool() ? 'hospital' : 'clinic',
      });
    }
  }
}
