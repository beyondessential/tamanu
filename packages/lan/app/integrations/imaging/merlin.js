import fetch from 'node-fetch';

export async function getUrlForResult(models, config, result) {
  const { externalCode } = result;
  if (!externalCode) return null;
  
  const {
    urlgen,
    auth: { username, password },
    patientIdType = 'AUID',
  } = config;

  const url = new URL(urlgen);
  url.username = username;
  url.password = password;
  url.searchParams.set('accesion', externalCode);
  
  // TODO: where do we get the patient ID from?
  url.searchParams.set('patIdType', patientIdType);
  url.searchParams.set('patId', 'UID0000403');

  const res = await fetch(url);
  return res.text();
}
