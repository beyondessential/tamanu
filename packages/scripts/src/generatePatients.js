const request = require('request');

const URL = 'http://randomuser.me/api?results=30';

async function getDetails() {
  return new Promise((resolve, reject) => {
    request.get(URL, (err, response, body) => {
      err ? reject(err) : resolve(body);
    });
  });
}

const token = [process.argv[2], process.argv[3]].filter(x => x).join(' ');
const OPTIONS = {
  url: 'http://localhost:4000/realm/patient',
  json: true,
  headers: {
    Authorization: token,
  },
};

async function createPatient(body) {
  return new Promise((resolve, reject) => {
    request.post(Object.assign({}, OPTIONS, { body }), (err, response, responseBody) => {
      err ? reject(err) : resolve(responseBody);
    });
  });
}

function titleCase(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

async function run() {
  if (!token) {
    console.log(
      'No auth token provided. Copy one from a web request sent by the app and call this script again: \n$ node packages/scripts/generatePatients.js Basic abc123xyz',
    );
    return;
  }
  const details = await getDetails();
  const users = JSON.parse(details).results;

  const sexIds = {
    male: 'ref/sex/male',
    female: 'ref/sex/female',
    other: 'ref/sex/other',
  };

  users.map(async r => {
    const user = {
      sex: sexIds[r.gender] || sexIds.other,
      firstName: titleCase(r.name.first),
      lastName: titleCase(r.name.last),
      dateOfBirth: r.dob.date.split('T')[0],
    };
    const result = await createPatient(user);
  });
}

run();
