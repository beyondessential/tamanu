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
  .demandOption(['address', 'user'])
  .command(
    'import',
    'Import a certificate into the pending signer',
    command =>
      command.option('input', {
        alias: 'i',
        describe: 'Certificate file to import',
        demandOption: true,
      }),
    argv => {
      Promise.resolve(importCommand(argv));
    },
  )
  .command(
    'export',
    'Export a certificate request from the pending signer',
    command =>
      command.option('output', {
        alias: 'o',
        describe: 'Filepath to save the csr to',
        demandOption: true,
      }),
    argv => {
      Promise.resolve(exportCommand(argv));
    },
  )
  .usage('Usage: $0 --address <url> --user <email> --input <file>')
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

// Send a request to the appropriate address and endpoint
async function fetchFromSyncServer(address, endpoint, params = {}) {
  const { headers = {}, body, method = 'GET', ...otherParams } = params;

  const url = `${address}/${API_VERSION}/${endpoint}`;

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

// Prompt user for password, authenticate with server, save token to global var
async function loginToServer({ address, user }) {
  console.log(`Logging into ${address} as ${user}`);
  const password = await getPassword();
  const loginResponse = await fetchFromSyncServer(address, 'login', {
    method: 'POST',
    body: {
      email: user,
      password,
    },
  });
  token = loginResponse.token;
}

// Upload input certificate file to address
async function uploadCertificate({ address, input }) {
  console.log(`Uploading certificate: ${input}`);
  const certificate = await fs.promises.readFile(input, 'utf8');
  const importResponse = await fetchFromSyncServer(
    address,
    'integration/signer/importCertificate',
    {
      method: 'POST',
      body: {
        certificate,
      },
    },
  );

  console.log(importResponse.message);
}

// Fetch certificate request from address, save to output filepath
async function fetchCertificateRequest({ address, output }) {
  console.log('Fetching certificate request');
  const certificateResponse = await fetchFromSyncServer(
    address,
    'integration/signer/exportCertificateRequest',
  );

  console.log(`Writing to ${output}`);
  await fs.promises.writeFile(output, certificateResponse.request);
}

// Login and upload certificate
async function importCommand({ address, user, input }) {
  await loginToServer({ address, user });
  await uploadCertificate({ address, input });

  console.log('Success');
  return 0;
}

// Login and export certificate request
async function exportCommand({ address, user, output }) {
  await loginToServer({ address, user });
  await fetchCertificateRequest({ address, output });

  console.log('Success');
  return 0;
}
