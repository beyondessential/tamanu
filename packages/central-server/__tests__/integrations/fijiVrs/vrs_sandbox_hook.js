const express = require('express');
const bodyParser = require('body-parser');
const Chance = require('chance');
const morgan = require('morgan');

// shared helper for logging
let stepNum = 1;
const step = (...msg) =>
  console.log(`${stepNum > 1 ? '\n' : ''} \x1b[33m`, `${stepNum++}.`, ...msg, '\x1b[0m');
step('randomly generating patient...');

// retrieve env vars
const port = process.env.PORT || '3001';
const tamanuHost = process.env.TAMANU_HOST || 'http://localhost:3000';
const username = process.env.USERNAME || 'username';
const password = process.env.PASSWORD || 'password';

// randomly generate some data
const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
const chance = new Chance(seed);
console.log(`seed: ${seed}`);

const patient = {
  individual_refno: chance.integer({ min: 0, max: 10000000 }),
  id_type: 'TAMANU_TESTBED_ID',

  identifier: chance.guid(),
  fname: chance.first(),
  lname: chance.last(),
  dob: chance
    .date({ year: 1980 })
    .toISOString()
    .slice(0, 10),
  sex: chance.pickone(['MALE', 'FEMALE']),
  sub_division: chance.pickone(['Matautu', 'Aasufou', 'Aele']),
  phone: chance.phone(),
  email: chance.email(),
};
const token = chance.hash();
const fetchId = chance.integer({ min: 1, max: 2000000 });
console.log('patient:', patient);
console.log('token:', token);
console.log('fetchId:', fetchId);

// set up express app and shared middleware
const app = express();
app.use(morgan('dev'));
app.use('/token', bodyParser.raw({ type: 'text/plain' }));
app.use('/api', bodyParser.json());
app.use('/api', (req, res, next) => {
  const auth = req.get('Authorization');
  if (auth !== `Bearer ${token}`) {
    throw new AuthError(`Auth header did not match token ${token}: ${auth}`);
  }
  next();
});

// step 1. - call the hook
const callHook = async body => {
  const url = `${tamanuHost}/api/public/integration/fijiVrs/hooks/patientCreated`;
  const opts = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  };
  console.log('fetch (calling tamanu):', url, opts);
  const response = await fetch(url, opts);
  const responseBody = await response.json();
  console.log('received callHook response:', responseBody);
  if (!response.ok) {
    throw new Error(`fetch failed (${response.status}):\n${JSON.stringify(responseBody, null, 2)}`);
  }
  return responseBody;
};

// step 2. - wait for a token request
let didToken = () => {
  throw new Error('token was too early');
};
app.post('/token', (req, res) => {
  const actual = req.body.toString();
  console.log('received token req:', actual);
  const expected = [
    'grant_type=password',
    `username=${encodeURIComponent(username)}`,
    `password=${encodeURIComponent(password)}`,
  ].join('&');
  if (actual !== expected) {
    throw new AuthError(`wrong credentials: expected ${expected}, got ${actual}`);
  }
  didToken();
  const payload = {
    access_token: token,
    expires_in: chance.integer({ min: 100000, max: 1000000 }),
    token_type: 'bearer',
  };
  console.log('returned token payload:', payload);
  res.send(payload);
});

// step 3. - wait for a fetch request
let didFetch = () => {
  throw new Error('fetch was too early');
};
app.get('/api/Tamanu/Fetch', (req, res) => {
  console.log('fetch endpoint hit:', req.query.fetch_id);
  if (req.query.fetch_id !== fetchId.toString()) {
    throw new Error(`Wrong fetch_id: expected ${fetchId}, got ${req.query.fetch_id}`);
  }
  didFetch();
  const payload = { response: 'success', data: patient };
  console.log('returned fetch payload:', payload);
  res.send(payload);
});

// step 4. - wait for an ack
let didAck = () => {
  throw new Error('ack was too early');
};
app.get('/api/Tamanu/Acknowledge', (req, res) => {
  console.log('ack endpoint hit:', req.query.fetch_id);
  if (req.query.fetch_id !== fetchId.toString()) {
    throw new Error(`Wrong fetch_id: expected ${fetchId}, got ${req.query.fetch_id}`);
  }
  didAck();
  const payload = { response: true };
  console.log('returned ack payload:', payload);
  res.send(payload);
});

// error handling middleware - we need this for debugging auth with the 401
class AuthError extends Error {}
app.use((error, req, res, next) => {
  // express relies on function arity to determine if this is an error handler.
  // "use" the unused `next` argument so it's not elided
  void(next);

  console.error(error);
  if (error instanceof AuthError) {
    res.status(401).send({ error });
  } else {
    res.status(500).send({ error });
  }
});

// listen and then run tests
const server = app.listen(port, async () => {
  try {
    step('hitting hook...');
    const tokenPromise = new Promise(resolve => {
      didToken = resolve;
    });
    const fetchPromise = new Promise(resolve => {
      didFetch = resolve;
    });
    const ackPromise = new Promise(resolve => {
      didAck = resolve;
    });
    const hookPromise = callHook({
      operation: 'INSERT',
      fetch_id: fetchId,
      created_datetime: new Date()
        .toISOString()
        .replace('T', ' ')
        .replace('Z', ''),
    });

    step('waiting for token...');
    await tokenPromise;

    step('waiting for fetch...');
    await fetchPromise;

    step('waiting for ack...');
    await ackPromise;

    step('asserting hook completed...');
    await hookPromise;

    step('all done!');
  } catch (e) {
    console.error('failed with error:', e);
    process.exit(1);
  } finally {
    server.close();
  }
});
