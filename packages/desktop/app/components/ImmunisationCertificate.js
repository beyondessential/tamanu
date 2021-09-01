import React, { useEffect } from 'react';

import { Certificate, Spacer, Table } from './Print/Certificate';
import { DateDisplay } from './DateDisplay';

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
      <Table>
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
              <td><DateDisplay date={immunisation.date} /></td>
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
