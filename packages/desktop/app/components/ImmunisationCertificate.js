import React, { useState, useEffect } from 'react';
import { generateUVCI } from 'shared/utils/uvci';

import { Certificate, Table } from './Print/Certificate';
import { DateDisplay } from './DateDisplay';
import { useApi } from '../api';
import { useLocalisation } from '../contexts/Localisation';

const ASSET_NAME = 'vaccine-certificate-watermark';

const renderFooter = getLocalisation => {
  const contactEmail = getLocalisation('templates.vaccineCertificate.emailAddress');
  const contactNumber = getLocalisation('templates.vaccineCertificate.contactNumber');

  return (
    <div>
      {contactEmail && (
        <p>
          <span>Email address: </span>
          <span>{contactEmail}</span>
        </p>
      )}
      {contactNumber && (
        <p>
          <span>Contact number: </span>
          <span>{contactNumber}</span>
        </p>
      )}
    </div>
  );
};

const getUVCI = (getLocalisation, { immunisations }) => {
  // If there are no immunisations return a blank uvci
  if (immunisations.length === 0) {
    return '';
  }

  const format = getLocalisation('uvci.format');

  // Ensure that the records are sorted desc by date
  const latestVaccination = immunisations
    .slice()
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];

  return generateUVCI(latestVaccination.id, format, {
    countryCode: getLocalisation('country.alpha-2'),
  });
};

export const ImmunisationCertificate = ({ patient, immunisations }) => {
  const [watermark, setWatermark] = useState('');
  const [watermarkType, setWatermarkType] = useState('');
  const api = useApi();

  useEffect(() => {
    (async () => {
      const response = await api.get(`asset/${ASSET_NAME}`);
      setWatermark(Buffer.from(response.data).toString('base64'));
      setWatermarkType(response.type);
    })();
  }, [api]);

  const { getLocalisation } = useLocalisation();

  if (!immunisations) {
    return null;
  }

  const countryName = getLocalisation('country.name');
  const healthFacility = getLocalisation('templates.vaccineCertificate.healthFacility');

  return (
    <Certificate
      patient={patient}
      header="Vaccination Certification"
      watermark={watermark}
      watermarkType={watermarkType}
      footer={renderFooter(getLocalisation)}
      customAccessors={{ UVCI: () => getUVCI(getLocalisation, { immunisations }) }}
      primaryDetailsFields={[
        'firstName',
        'lastName',
        'dateOfBirth',
        'sex',
        'displayId',
        'nationalityId',
        'passport',
        'UVCI',
      ]}
    >
      <Table>
        <thead>
          <tr>
            <td>Vaccine</td>
            <td>Vaccine brand</td>
            <td>Schedule</td>
            {countryName && <td>Country</td>}
            <td>Health facility</td>
            <td>Date</td>
            <td>Batch Number</td>
          </tr>
        </thead>
        <tbody>
          {immunisations.map(immunisation => (
            <tr key={immunisation.id}>
              <td>{immunisation.scheduledVaccine?.label}</td>
              <td>{immunisation.scheduledVaccine?.vaccine?.name}</td>
              <td>{immunisation.scheduledVaccine?.schedule}</td>
              {countryName && <td>{countryName}</td>}
              <td>{healthFacility}</td>
              <td>
                <DateDisplay date={immunisation.date} />
              </td>
              <td>{immunisation.batch || ''}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Certificate>
  );
};
