import React, { useEffect } from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';
import { Certificate, Spacer } from './Print/Certificate';

const VaccineTable = styled.table`
  border: 1px solid ${Colors.darkText};
  border-collapse: collapse;

  thead {
    font-weight: bold;
  }
  td {
    padding: 5px 10px;
    border: 1px solid ${Colors.darkText};
  }
`;

export const ImmunisationCertificate = ({ patient, immunisations }) => {
  const [hasEditedRecord, setHasEditedRecord] = React.useState(false);

  useEffect(() => {
    if (!immunisations) {
      return;
    }
    setHasEditedRecord(
      immunisations.findIndex(immunisation => immunisation.createdAt !== immunisation.updatedAt) !==
        -1,
    );
  }, [immunisations]);

  if (!immunisations) {
    return null;
  }
  return (
    <Certificate patient={patient} header="Personal vaccination certificate">
      <VaccineTable>
        <thead>
          <tr>
            <td>Vaccine type</td>
            <td>Vaccine given</td>
            <td>Schedule</td>
            <td>Health facility</td>
            <td>Given by</td>
            <td>Date</td>
          </tr>
        </thead>
        <tbody>
          {immunisations.map(immunisation => (
            <tr key={immunisation.id}>
              <td>
                {immunisation.scheduledVaccine?.label}
                {immunisation.createdAt !== immunisation.updatedAt ? ' *' : ''}
              </td>
              <td>{immunisation.scheduledVaccine?.label}</td>
              <td>{immunisation.scheduledVaccine?.schedule}</td>
              <td>{immunisation.encounter?.location?.name || ''}</td>
              <td>{immunisation.encounter?.examiner?.displayName || ''}</td>
              <td>{new Date(immunisation.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </VaccineTable>
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
