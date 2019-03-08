const request = require('request');

// Names found at https://www.bhutanpelyabtours.com/bhutanese-personal-names/
// N.B. most names are gender neutral, but some are specific for females, so have
// an assigned sex in this data
const BHUTAN_DEMO_USERS = [
  {
    firstName: 'Ugyen',
    lastName: 'Wangdi',
  },
  {
    firstName: 'Dechen',
    lastName: 'Wangmo',
    sex: 'female',
  },
  {
    firstName: 'Karma',
    lastName: 'Chime',
  },
  {
    firstName: 'Norbu',
    lastName: 'Wangmo',
    sex: 'female',
  },
  {
    firstName: 'Ngawang',
    lastName: 'Pelden',
  },
  {
    firstName: 'Kinley',
    lastName: 'Phuentsho',
  },
  {
    firstName: 'Sangay',
    lastName: 'Wangyel',
  },
  {
    firstName: 'Tandin',
    lastName: 'Phurba',
  },
  {
    firstName: 'Kiba',
    lastName: 'Wangmo',
    sex: 'female',
  },
  {
    firstName: 'Pema',
    lastName: 'Karzi',
    sex: 'female',
  },
  {
    firstName: 'Teeyum',
    lastName: 'Galley',
  },
  {
    firstName: 'Sonam',
    lastName: 'Pema',
  },
  {
    firstName: 'Tshering',
    lastName: 'Yangchen',
  },
  {
    firstName: 'Jigme',
    lastName: 'Lhaden',
    sex: 'female',
  },
  {
    firstName: 'Yangchen',
    lastName: 'Lhamo',
    sex: 'female',
  },
  {
    firstName: 'Tandin',
    lastName: 'Dorji',
  },
  {
    firstName: 'Ngawang',
    lastName: 'Tobgay',
  },
  {
    firstName: 'Sangay',
    lastName: 'Tenzin',
  },
  {
    firstName: 'Pema',
    lastName: 'Choden',
    sex: 'female',
  },
  {
    firstName: 'Kinley',
    lastName: 'Wangchuk',
  },
  {
    firstName: 'Passang',
    lastName: 'Tshering',
  },
  {
    firstName: 'Phuentsho',
    lastName: 'Dorji',
  },
  {
    firstName: 'Tshering',
    lastName: 'Dorji',
  },
  {
    firstName: 'Dorji',
    lastName: 'Tashi',
  },
];

module.exports = async (database) => {
  const URL = `http://randomuser.me/api?results=${BHUTAN_DEMO_USERS.length}`;

  async function fetchNewMockPatients() {
    return new Promise((resolve, reject) => {
      request.get(URL, (err, response, body) => {
        err ? reject(err) : resolve(body);
      });
    });
  }

    const details = await fetchNewMockPatients();
    const mockPatients = JSON.parse(details).results

    database.write(() => {
      BHUTAN_DEMO_USERS.map(async ({ firstName, lastName, sex }, i) => {
        const patientDetails = {
          displayId: `TMP${i.toFixed().padStart(4, '0')}`,
          sex: sex || mockPatients[i].gender,
          firstName,
          lastName,
          dateOfBirth: mockPatients[i].dob.date.split('T')[0],
        };
        database.create(
          'patient',
          patientDetails,
          true,
        );
      });
    });
}
