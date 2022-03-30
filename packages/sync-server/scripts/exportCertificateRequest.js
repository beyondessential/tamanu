const fetch = require('node-fetch');
const fs = require('fs');

// TODO: Don't put passwords on the command line
const [nodeName, scriptName, baseUrl, outputFile, userEmail, password] = process.argv;

const API_VERSION = 'v1';
let token = null;

if (!baseUrl || !userEmail) {
  throw new Error(
    `Usage ${nodeName} ${scriptName} https://example.com/from-this-server path/to/output/file user@example.com`,
  );
}

async function fetchFromSyncServer(endpoint, params = {}) {
  const { headers = {}, body, method = 'GET', ...otherParams } = params;

  const url = `${baseUrl}/${API_VERSION}/${endpoint}`;

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
    console.log(`Server responded with status code ${response.status} (${responseBody.error})`);
    process.exit(1);
  }

  return responseBody;
}

// Main function
(async () => {
  console.log(`Logging into ${baseUrl} as ${userEmail}`);
  const loginResponse = await fetchFromSyncServer('login', {
    method: 'POST',
    body: {
      email: userEmail,
      password,
      // facilityId ??
    },
  });
  token = loginResponse.token;
  console.log('Fetching certificate request');
  const certificateResponse = await fetchFromSyncServer(
    'integration/signer/exportCertificateRequest',
  );

  console.log(`Writing to ${outputFile}`);
  await fs.promises.writeFile(outputFile, certificateResponse.request);

  console.log('Success');
  return 0;
})();
