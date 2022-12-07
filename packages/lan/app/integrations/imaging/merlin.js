import fetch from 'node-fetch';

export async function getUrlForResult({ Patient, Encounter }, config, result) {
  const { externalCode } = result;
  if (!externalCode) return null;

  const request = await irr.getRequest({
    include: [
      {
        model: Encounter,
        as: 'encounter',
        include: [{ model: Patient, as: 'patient' }],
      },
    ],
  });
  const { patient } = request.encounter;

  const {
    urlgen,
    auth: { username, password },
    patientId: { type, field },
  } = config;

  const url = new URL(urlgen);
  url.username = username;
  url.password = password;
  url.searchParams.set('accesion', externalCode);

  url.searchParams.set('patIdType', type);
  url.searchParams.set('patId', patient[field]);

  const res = await fetch(url);
  return res.text();
}
