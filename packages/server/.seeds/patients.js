const request = require('request');
const { padStart } = require('lodash');

module.exports = async (database) => {
  const URL = 'http://randomuser.me/api?results=30';

  async function fetchNewMockPatients() {
    return new Promise((resolve, reject) => {
      request.get(URL, (err, response, body) => {
        err ? reject(err) : resolve(body);
      });
    });
  }

  function titleCase(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
  }

    const details = await fetchNewMockPatients();
    const mockPatients = JSON.parse(details).results

    database.write(() => {
      mockPatients.map(async (r, i) => {
        const patientDetails = {
          displayId: `TMP${padStart(i.toFixed(), 4, '0')}`,
          sex: r.gender,
          firstName: titleCase(r.name.first),
          lastName: titleCase(r.name.last),
          dateOfBirth: r.dob.date.split('T')[0],
        };
        database.create(
          'patient',
          patientDetails,
          true,
        );
      });
    });
}
