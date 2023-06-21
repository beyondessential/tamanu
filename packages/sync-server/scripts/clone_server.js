const _ = require('lodash');
const fetch = require('node-fetch');

const [nodeName, scriptName, fromUrl, toUrl] = process.argv;

if (!fromUrl || !toUrl) {
  throw new Error(
    `Usage: ${nodeName} ${scriptName} https://example.com/from-this-server https://example.org/to-this-server`,
  );
}

const DOWN_LIMIT = 100;
const UP_LIMIT = 100;
const SLEEP_TIME = 100;

const HEADERS = {
  Authorization: 'Bearer fake-token',
  'Content-Type': 'application/json',
  Accepts: 'application/json',
};

const CHANNELS = [
  'reference',
  'patient',
  'user',
  'program',
  'programDataElement',
  'scheduledVaccine',
  'survey',
  'surveyScreenComponent',
];
const PATIENT_CHANNELS = [
  'encounter',
];

async function asyncSleep(ms) {
  return new Promise(resolve => {
    console.log(`sleeping ${ms}ms...`);
    setTimeout(() => resolve(), ms);
  });
}

async function fetchChannel(channel) {
  console.log(`fetching ${channel}:`);
  let count = null;
  let records = [];
  let nextCursor = '0';
  let lastCursor = '';
  do {
    const url = `${fromUrl}/v1/sync/${encodeURIComponent(
      channel,
    )}?since=${nextCursor}&limit=${DOWN_LIMIT}`;
    console.log(`  <- GET ${url}`);
    const response = await fetch(url, {
      headers: HEADERS,
    });
    if (!response.ok) {
      console.warn(`  x- ERROR: ${await response.text()}`);
      continue;
    }
    const json = await response.json();
    count = json.records.length;
    lastCursor = nextCursor;
    nextCursor = json.cursor;
    records = [...records, ...json.records];
  } while (nextCursor && lastCursor !== nextCursor);
  return records;
}

async function sendToChannel(channel, records) {
  console.log(`sending to ${channel}`);
  for (const recordChunk of _.chunk(records, UP_LIMIT)) {
    const url = `${toUrl}/v1/sync/${encodeURIComponent(channel)}`;
    console.log(`  -> POST ${url} (${recordChunk.length} records)`);
    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(recordChunk),
    });
    if (!response.ok) {
      console.warn(`  -x ERROR: ${await response.text()}`);
      continue;
    }
  }
}

async function deleteFromChannel(channel, records) {
  console.log(`deleting from ${channel}:`);
  const encodedChannel = encodeURIComponent(channel);
  for (const record of records) {
    const id = encodeURIComponent(record.data.id);
    const url = `${toUrl}/v1/sync/${encodedChannel}/${id}`;
    console.log(`  -> DELETE ${url}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: HEADERS,
    });
    if (!response.ok) {
      console.warn(`  -x ERROR: ${await response.text()}`);
      continue;
    }
  }
}

async function copyChannel(channel) {
  // fetch
  const results = await fetchChannel(channel);
  if (results.length === 0) {
    console.log(`fetched 0 records, skipping channel ${channel}`);
    return;
  }

  // upload
  console.log(`fetched ${results.length} records, uploading`);
  // const seenIds = []; // For use if there are duplicate id errors
  // const filteredResults = results.filter(({ data }) => seenIds.includes(data.id) ? false : seenIds.push(data.id) || true);

  await sendToChannel(channel, results);

  // delete
  const deleted = results.filter(r => r.isDeleted);
  if (deleted.length > 0) {
    console.log(`identified ${deleted.length} deleted records`);
    await asyncSleep(SLEEP_TIME); // wait for record to be saved
    await deleteFromChannel(channel, deleted);
  }
}

(async () => {
  for (const channel of CHANNELS) {
    await copyChannel(channel);
    await asyncSleep(SLEEP_TIME);
  }
  for (const channelSuffix of PATIENT_CHANNELS) {
    const patients = await fetchChannel('patient');
    for (const patient of patients) {
      const channel = `patient/${patient.data.id}/${channelSuffix}`;
      await copyChannel(channel);
    }
  }
})()
  .then(() => {
    console.log('success!');
  })
  .catch(e => {
    console.error('caught error, stopping...');
    throw e;
  });
