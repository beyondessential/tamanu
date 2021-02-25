import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { TamanuLogo } from './TamanuLogo';
import { Colors } from '../constants';
import { getCurrentUser } from '../store/auth';

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr 5fr;
`;

const HeaderText = styled.div`
  text-align: center;
`;

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

const DumbImmunisationCertificate = ({
  certificateTitle,
  certificateSubtitle,
  currentUser,
  patient,
  immunisations,
}) => {
  const [hasEditedRecord, setHasEditedRecord] = React.useState(false);

  React.useEffect(() => {
    if (!immunisations) {
      return;
    }
    setHasEditedRecord(
      immunisations.findIndex(immunisation => immunisation.createdAt != immunisation.updatedAt) !==
        -1,
    );
  }, [immunisations]);

  if (!immunisations) {
    return null;
  }

  return (
    <div>
      <Header>
        <TamanuLogo size={100} />
        <HeaderText>
          <h3>{certificateTitle}</h3>
          <p>
            <strong>{certificateSubtitle}</strong>
          </p>
        </HeaderText>
      </Header>
      <Spacer />
      <PatientDetailsHeader>Personal immunisation certificate</PatientDetailsHeader>
      <TwoColumnContainer>
        <p>First name: {patient.firstName}</p>
        <p>Last name: {patient.lastName}</p>
        <p>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
        <p>Birthplace:</p>
        <p>Gender: {patient.sex}</p>
        <p>Mother:</p>
      </TwoColumnContainer>
      <Spacer />
      <VaccineTable>
        <thead>
          <tr>
            <td>Vaccine type</td>
            <td>Vaccine given</td>
            <td>Health facility</td>
            <td>Given by</td>
            <td>Date</td>
          </tr>
        </thead>
        <tbody>
          {immunisations.map((immunisation, index) => (
            <tr key={index}>
              <td>
                {immunisation.vaccine}
                {immunisation.createdAt !== immunisation.updatedAt ? ' *' : ''}
              </td>
              <td>{immunisation.vaccine}</td>
              <td>{immunisation.facility ? immunisation.facility.name : ''}</td>
              <td>{immunisation.givenBy ? immunisation.givenBy.displayName : ''}</td>
              <td>{new Date(immunisation.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </VaccineTable>
      <Spacer />
      <TwoColumnContainer>
        <p>Printed by: {currentUser ? currentUser.displayName : ''}</p>
        <p>Printing date: {new Date().toLocaleDateString()}</p>
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
