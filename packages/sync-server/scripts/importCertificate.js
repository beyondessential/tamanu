/* eslint no-console: "off" */
const fetch = require('node-fetch');
const fs = require('fs');
const readline = require('readline');

const API_VERSION = 'v1';
let token = null; // Auth token, saved after login

// Setup command line args
const yargs = require('yargs/yargs')(process.argv.slice(2))
  .option('address', {
    alias: 'a',
    describe: 'Address of the sync server instance to connect to',
  })
  .option('user', {
    alias: 'u',
    describe: 'Email address of the user account to authenticate as',
  })
  .option('input', {
    alias: 'i',
    describe: 'Certificate file to upload',
  })
  .demandOption(['address', 'user', 'input'])
  .help().argv;

function getPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve =>
    rl.question('Password: ', password => {
      rl.close();
      resolve(password);
    }),
  );
}

// Send a request to the appropriate address
async function fetchFromSyncServer(endpoint, params = {}) {
  const { headers = {}, body, method = 'GET', ...otherParams } = params;

  const url = `${yargs.address}/${API_VERSION}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined,
      'Content-Type': body ? 'application/json' : undefined,
      ...headers,
    },
    body: body && JSON.stringify(body),
    timeout: 10000,
    ...otherParams,
  });
  const responseBody = await response.json();

  if (!response.ok) {
    console.log('!!! ERROR !!!');
    console.log(
      `Server responded with status code ${response.status} (${responseBody.error.message})`,
    );
    process.exit(1);
  }

  return responseBody;
}

// Main function
(async () => {
  console.log(`Logging into ${yargs.address} as ${yargs.user}`);
  const password = await getPassword();
  const loginResponse = await fetchFromSyncServer('login', {
    method: 'POST',
    body: {
      email: yargs.user,
      password,
    },
  });
  token = loginResponse.token;

  console.log(`Uploading certificate: ${yargs.input}`);
  const certificate = await fs.promises.readFile(yargs.input, 'utf8');
  const importResponse = await fetchFromSyncServer('integration/signer/importCertificate', {
    method: 'POST',
    body: {
      certificate,
    },
  });

  console.log(importResponse.message);

  console.log('Success');
  return 0;
})();
