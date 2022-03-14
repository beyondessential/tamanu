import React, { useState, useEffect } from 'react';
import { generateHashFromUUID } from 'shared/utils/generateHashFromUUID';

import { Certificate, Spacer, Table } from './Print/Certificate';
import { DateDisplay } from './DateDisplay';
import { useApi } from '../api';
import { useLocalisation } from '../contexts/Localisation';

const ASSET_NAME = 'vaccine-certificate-watermark';

const renderFooter = getLocalisation => {
  const contactEmail = getLocalisation('templates.vaccineCertificateFooter.emailAddress');
  const contactNumber = getLocalisation('templates.vaccineCertificateFooter.contactNumber');

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

const getUVCI = ({ immunisations }) => {
  // If there are no immunisations return a blank uvci
  if (immunisations.length === 0) {
    return '';
  }

  // Ensure that the records are sorted desc by date
  const latestVaccination = immunisations
    .slice()
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];

  return generateHashFromUUID(latestVaccination.id);
};

export const ImmunisationCertificate = ({ patient, immunisations }) => {
  const [hasEditedRecord, setHasEditedRecord] = useState(false);
  const [watermark, setWatermark] = useState('');
  const [watermarkType, setWatermarkType] = useState('');
  const api = useApi();

  useEffect(() => {
    if (!immunisations) {
      return;
    }
    setHasEditedRecord(
      immunisations.findIndex(immunisation => immunisation.createdAt !== immunisation.updatedAt) !==
        -1,
    );
  }, [immunisations]);

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

  return (
    <Certificate
      patient={patient}
      header="Vaccination Certification"
      watermark={watermark}
      watermarkType={watermarkType}
      footer={renderFooter(getLocalisation)}
      customAccessors={{ UVCI: () => getUVCI({ patient, immunisations }) }}
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
            <td>Vaccine type</td>
            <td>Vaccine given</td>
            <td>Schedule</td>
            {countryName && <td>Country</td>}
            <td>Health facility</td>
            <td>Given by</td>
            <td>Date</td>
            <td>Batch Number</td>
          </tr>
        </thead>
        <tbody>
          {immunisations.map(immunisation => (
            <tr key={immunisation.id}>
              <td>
                {immunisation.scheduledVaccine?.label}
                {immunisation.createdAt !== immunisation.updatedAt ? ' *' : ''}
              </td>
              <td>{immunisation.scheduledVaccine?.vaccine?.name}</td>
              <td>{immunisation.scheduledVaccine?.schedule}</td>
              {countryName && <td>{countryName}</td>}
              <td>{immunisation.encounter?.location?.Facility?.name || ''}</td>
              <td>{immunisation.encounter?.examiner?.displayName || ''}</td>
              <td>
                <DateDisplay date={immunisation.date} />
              </td>
              <td>{immunisation.batch || ''}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {hasEditedRecord ? (
        <>
          <Spacer />
          <sup>
            * This vaccine record has been updated by a user and this is the most recent record
          </sup>
          <Spacer />
        </>
      ) : null}
    </Certificate>
  );
};
