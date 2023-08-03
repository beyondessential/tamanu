import { formatISO, differenceInYears } from 'date-fns';
import { Activity } from '../board/Activity.js';
import { chance, optionally, upto } from '../fake.js';

export class Intake extends Activity {
  async act(): Promise<void> {
    const api = await this.context.api.as('practitioner');

    for (const _ of upto(5)) {
      const dateOfBirth = chance.birthday();
      const age = differenceInYears(new Date(), dateOfBirth);
      await api.post('patient', {
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
    }
  }
}
