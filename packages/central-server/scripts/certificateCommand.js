/* eslint no-console: "off" */
const fs = require('fs');
const prompts = require('prompts');
const program = require('commander');

let token = null; // Auth token, saved after login

// Required args for all commands
program
  .requiredOption('-a, --address <url>', 'Address of the central server instance to connect to')
  .requiredOption('-u, --user <email>', 'Email address of the user account to authenticate as');

// Setup import action
program
  .command('import <file>')
  .description('Import a certificate into the pending signer')
  .option('-s, --periodStart <date>', 'Start date of the signers working period')
  .option('-e, --periodEnd <date>', 'End date of the signers working period')
  .action((file, options) => {
    const globalOptions = program.opts();
    importCommand({ ...globalOptions, ...options, input: file });
  });

// Setup export action
program
  .command('export <file>')
  .description('Export a certificate request from the pending signer')
  .action(file => {
    const options = program.opts();
    exportCommand({ ...options, output: file });
  });

program.parse();

// Send a request to the appropriate address and endpoint
async function fetchFromSyncServer(address, endpoint, params = {}) {
  const { headers = {}, body, method = 'GET', ...otherParams } = params;

  const url = `${address}/api/${endpoint}`;

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
  const { password } = await prompts({
    type: 'invisible',
    name: 'password',
    message: 'Password: ',
  });
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
async function uploadCertificate({ address, input, workingPeriod }) {
  console.log(`Uploading certificate: ${input}`);
  const certificate = await fs.promises.readFile(input, 'utf8');
  const importResponse = await fetchFromSyncServer(
    address,
    'integration/signer/importCertificate',
    {
      method: 'POST',
      body: {
        certificate,
        workingPeriod,
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
async function importCommand(options) {
  const { address, user, input, periodStart, periodEnd } = options;
  const workingPeriod = { start: periodStart, end: periodEnd };
  await loginToServer({ address, user });
  await uploadCertificate({
    address,
    input,
    workingPeriod,
  });
}

// Login and export certificate request
async function exportCommand({ address, user, output }) {
  await loginToServer({ address, user });
  await fetchCertificateRequest({ address, output });
}
