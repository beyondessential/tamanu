const express = require('express');
const bodyParser = require('body-parser');
const Chance = require('chance');
const fetch = require('node-fetch');
const morgan = require('morgan');

const seed = Math.random();
const chance = new Chance(seed);
console.log(`seed=${seed}`);

const port = process.env.PORT || '3001';
const tamanuHost = process.env.TAMANU_HOST || 'http://localhost:3000';

// generate patient
const patient = {
  individual_refno: chance.integer({ min: 0, max: 10000000 }),
  id_type: 'TAMANU_TESTBED_ID',

  identifier: chance.guid(),
  fname: chance.first(),
  lname: chance.last,
  dob: chance.date({ year: 1980 }).toISOString(),
  sex: chance.pickone(['MALE', 'FEMALE', 'OTHER']),
  sub_division: chance.pickone(['Matautu', 'Aasufou', 'Aele']),
  phone: chance.phone(),
  email: chance.email(),
};

const token = chance.hash();

const fetchId = chance.integer({ min: 1, max: 2000000 });

const step = (...msg) => console.log(' \x1b[33m', ...msg, '\x1b[0m');

let didFetch = () => {
  throw new Error('fetch was too early');
};
let didAck = () => {
  throw new Error('ack was too early');
};

const fetchAndLog = async (url, opts) => {
  console.log('fetch (calling tamanu):', url, opts);
  const response = await fetch(url, opts);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`fetch failed (${response.status}):\n${JSON.stringify(body, null, 2)}`);
  }
  return body;
};

const app = express();

app.use(bodyParser.json());
app.use(morgan('dev'));

app.post('/token', (req, res) => {
  console.log('received token req:', req.body);
  res.send({ token });
});

app.use('/api', req => {
  const auth = req.get('Authorization');
  if (auth !== `Bearer ${token}`) {
    throw new Error(`Auth header did not match token ${token}: ${auth}`);
  }
});
app.get('/api/Applicants/Tamanu/Fetch/:id', (req, res) => {
  didFetch();
  res.send({ data: patient });
});
app.get('/api/Applicants/Tamanu/Acknowledge/:id', (req, res) => {
  didAck();
  // TODO: test ack failure
  res.send({ response: true });
});

app.listen(port, async () => {
  step('hitting hook...');
  const fetchPromise = new Promise(resolve => {
    didFetch = resolve;
  });
  await fetchAndLog(`${tamanuHost}/v1/integration/fiji/vrs/hooks/patientCreated`, {
    method: 'POST',
    body: {
      fetch_id: fetchId,
    },
  });

  step('waiting for fetch...');
  const ackPromise = new Promise(resolve => {
    didAck = resolve;
  });
  await fetchPromise;

  step('waiting for ack...');
  await ackPromise;

  step('all done!');
});
