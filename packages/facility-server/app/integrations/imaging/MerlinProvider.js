import { Provider } from './Provider';

export class MerlinProvider extends Provider {
  async getUrlForResult(result) {
    const { Encounter, Patient } = this.models;

    const { externalCode } = result;
    if (!externalCode) return null;

    const request = await result.getRequest({
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
    } = this.config;

    const url = new URL(urlgen);
    url.searchParams.set('accession', externalCode);

    url.searchParams.set('patIdType', type);
    url.searchParams.set('patId', patient[field]);

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
    });
    return res.text();
  }
}
