const { Chance } = require('chance');
const request = require('request');
const { format } = require('date-fns');

// displayId generator pasted in from shared-src/src/utils/generateId
const rng = new Chance();

const generators = {
  A: () => String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  '0': () => Math.floor(Math.random() * 10).toFixed(0),
};

function createIdGenerator(format) {
  const generatorPattern = Array.from(format).map(char => generators[char] || (() => ''));

  return () => generatorPattern.map(generator => generator()).join('');
}

const generateId = createIdGenerator('AAAA000000');

const generateBloodType = () => rng.weighted(
  'O+ A+ B+ AB+ O- A- B- AB-'.split(' '),
  [38, 27, 22, 5, 2, 1, 1, 0.3]
);

// post to sync server
const HOST = 'https://sync-dev.tamanu.io';
function syncUpRecord(channel, record) {
  return new Promise((resolve, reject) => {
    request.post(`${HOST}/v1/sync/${channel}`, {
      headers: {
        authorization: '123',
        'content-type': 'application/json',
      },
      body: JSON.stringify(record),
    }, (err, response, body) => {
      if(err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}

function makePatient() {
  const sex = rng.bool() ? 'male' : 'female';
  const year = 2020 - rng.integer({ min: 2, max: 80 });
  return {
    firstName: rng.first({ gender: sex }),
    middleName: rng.first({ gender: sex }),
    culturalName: rng.first({ gender: sex }),
    lastName: rng.last(),
    dateOfBirth: format(rng.date({ year })),
    displayId: generateId(),
    bloodType: generateBloodType(),
    sex,
  };
}

let loaded = 0;
async function run() {
  const amount = 1;
  const patients = (new Array(amount)).fill(0).map(x => ({
    recordType: 'patient',
    data: makePatient()
  }));

  const response = await syncUpRecord('patient', patients);
  loaded += amount;
  console.log('loaded ', loaded);
  run();
}

run();
