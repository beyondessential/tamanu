const _ = require('lodash');
const fetch = require('node-fetch');

const [nodeName, scriptName, fromUrl, toUrl] = process.argv;

if (!fromUrl || !toUrl) {
  throw new Error(
    `Must provide from and to urls: ${nodeName} ${scriptName} https://example.com https://example.org`,
  );
}

const DOWN_LIMIT = 9999; // pagination bug still exists in mongo version
const UP_LIMIT = 100;
const SLEEP_TIME = 1000;

const RECORD_TYPE_TO_CHANNEL = {
  patient: 'patient',
  user: 'user',
  referenceData: 'reference',
  scheduledVaccine: 'scheduledVaccine',
  program: 'program',
  survey: 'survey',
  programDataElement: 'programDataElement',
  surveyScreenComponent: 'surveyScreenComponent',
};

const RECORD_TYPE_CONVERTERS = {
  scheduledVaccine: record => {
    const { vaccine, ...data } = record.data;
    return {
      ...record,
      data: {
        ...data,
        vaccineId: vaccine,
      },
    };
  },
};

const FROM_CHANNELS = ['patient', 'user', 'reference', 'vaccination', 'survey'];

async function asyncSleep(ms) {
  return new Promise(resolve => {
    console.log(`sleeping ${ms}ms...`);
    setTimeout(() => resolve(), ms);
  });
}

async function fetchChannel(channel) {
  let count = null;
  let records = [];
  let page = 0;
  do {
    const url = `${fromUrl}/v1/sync/${encodeURIComponent(
      channel,
    )}?since=0&limit=${DOWN_LIMIT}&page=${page}`;
    console.log(`  <- ${url}`);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-token',
      },
    });
    const json = await response.json();
    count = json.records.length;
    records = [...records, ...json.records];
    page++;
  } while (count > 0);
  return records;
}

async function sendToChannel(channel, records) {
  for (const recordChunk of _.chunk(records, UP_LIMIT)) {
    const url = `${toUrl}/v1/sync/${encodeURIComponent(channel)}`;
    console.log(`  -> ${url} (${recordChunk.length} records)`);
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-token',
      },
      body: JSON.stringify(recordChunk),
    });
    if (!result.ok) {
      const body = await result.json();
      throw new Error(`received error: ${JSON.stringify(body)}`);
    }
  }
}

(async () => {
  for (const fromChannel of FROM_CHANNELS) {
    console.log(`fetching ${fromChannel}...`);
    const results = await fetchChannel(fromChannel);
    const grouped = _.groupBy(results, 'recordType');
    console.log(
      `fetched ${results.length} records of types ${JSON.stringify(
        Object.keys(grouped),
      )} (from channel ${fromChannel})`,
    );
    for (const recordType of Object.keys(RECORD_TYPE_TO_CHANNEL)) {
      const toChannel = RECORD_TYPE_TO_CHANNEL[recordType];
      const records = grouped[recordType];
      if (!records) {
        continue;
      }
      const convertedRecords = records.map(RECORD_TYPE_CONVERTERS[recordType] || (r => r));
      console.log(
        `uploading ${convertedRecords.length} records (from ${fromChannel} to ${toChannel})`,
      );
      await sendToChannel(toChannel, convertedRecords);
      await asyncSleep(SLEEP_TIME);
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
