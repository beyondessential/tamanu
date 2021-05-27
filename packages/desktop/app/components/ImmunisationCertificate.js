import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { useLocalisation } from '../contexts/Localisation';
import { Colors } from '../constants';
import { getCurrentUser } from '../store/auth';
import { PrintLetterhead } from './PrintLetterhead';

const Spacer = styled.div`
  margin-top: 3rem;
`;

const PatientDetailsHeader = styled.strong`
  text-decoration: underline;
`;

const TwoColumnContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto;
`;

const VaccineTable = styled.table`
  border: 1px solid ${Colors.darkText};
  border-collapse: collapse;

  td {
    padding: 5px 10px;
    border: 1px solid ${Colors.darkText};
  }
`;

const UserEntrySection = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: 20px;
`;

const UnderlineP = styled.p`
  text-decoration: underline;
`;

const UnderlineEmptySpace = () => <UnderlineP>{new Array(100).fill('\u00A0')}</UnderlineP>;

const PRIMARY_DETAILS_FIELDS = [
  ['firstName'],
  ['lastName'],
  ['dateOfBirth', ({ dateOfBirth }) => new Date(dateOfBirth).toLocaleDateString()],
  ['Birthplace', () => null], // TODO: not populated
  ['sexId', ({ sex }) => sex?.name],
  ['Mother', () => null], // TODO: not populated
];

const DumbImmunisationCertificate = ({ currentUser, patient, immunisations }) => {
  const [hasEditedRecord, setHasEditedRecord] = React.useState(false);

  React.useEffect(() => {
    if (!immunisations) {
      return;
    }
    setHasEditedRecord(
      immunisations.findIndex(immunisation => immunisation.createdAt !== immunisation.updatedAt) !==
        -1,
    );
  }, [immunisations]);

  const { getLocalisation } = useLocalisation();

  if (!immunisations) {
    return null;
  }
  const primaryDetails = PRIMARY_DETAILS_FIELDS.filter(
    ([name]) => getLocalisation(`fields.${name}.hidden`) !== true,
  ).map(([name, accessor]) => {
    const label = getLocalisation(`fields.${name}.shortLabel`) || name;
    const value = accessor ? accessor(patient) : patient[name];
    return (
      <p key={name}>
        {`${label}: `}
        {value}
      </p>
    );
  });

  return (
    <div>
      <PrintLetterhead />
      <Spacer />
      <PatientDetailsHeader>Personal vaccination certificate</PatientDetailsHeader>
      <TwoColumnContainer>{primaryDetails}</TwoColumnContainer>
      <Spacer />
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
      <Spacer />
      <TwoColumnContainer>
        <p>
          {'Printed by: '}
          {currentUser ? currentUser.displayName : ''}
        </p>
        <p>
          {'Printing date: '}
          {new Date().toLocaleDateString()}
        </p>
      </TwoColumnContainer>
      <Spacer />
      <UserEntrySection>
        <p>Authorised by:</p>
        <UnderlineEmptySpace />
        <sup>(write name in pen)</sup>
        <div />
        <p />
        <div />
        <p>Signed:</p>
        <UnderlineEmptySpace />
        <p>Date:</p>
        <UnderlineEmptySpace />
      </UserEntrySection>
      {hasEditedRecord ? (
        <>
          <Spacer />
          <sup>
            * This vaccine record has been updated by a user and this is the most recent record
          </sup>
        </>
      ) : null}
      <Spacer />
    </div>
  );
};

export const ImmunisationCertificate = connect(state => ({
  currentUser: getCurrentUser(state),
}))(DumbImmunisationCertificate);
