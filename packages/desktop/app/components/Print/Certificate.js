import React from 'react';
import styled from 'styled-components';

import { useLocalisation } from '../../contexts/Localisation';
import { PrintLetterhead } from './Letterhead';

export const Spacer = styled.div`
  margin-top: 3rem;
`;

const PatientDetailsHeader = styled.strong`
  text-decoration: underline;
`;

const TwoColumnContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto;
`;

const PRIMARY_DETAILS_FIELDS = [
  ['firstName'],
  ['lastName'],
  ['dateOfBirth', ({ dateOfBirth }) => new Date(dateOfBirth).toLocaleDateString()],
  ['placeOfBirth', ({ additionalData }) => additionalData?.placeOfBirth],
  ['countryOfBirthId', ({ additionalData }) => additionalData?.countryOfBirth?.name],
  ['sex'],
  ['Mother', () => null], // TODO: not populated
];

const UserEntrySection = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: 20px;
`;

const UnderlineP = styled.p`
  text-decoration: underline;
`;

const UnderlineEmptySpace = () => <UnderlineP>{new Array(100).fill('\u00A0')}</UnderlineP>;

export const Certificate = ({ patient, currentUser, header, footer = null, children }) => {
  const { getLocalisation } = useLocalisation();
  const primaryDetails = PRIMARY_DETAILS_FIELDS.filter(
    ([name]) => getLocalisation(`fields.${name}.hidden`) !== true,
  ).map(([name, accessor]) => {
    const label = getLocalisation(`fields.${name}.shortLabel`) || name;
    const value = (accessor ? accessor(patient) : patient[name]) || '';
    return <p key={name}>{`${label}: ${value}`}</p>;
  });
  return (
    <div>
      <PrintLetterhead />
      <Spacer />
      <PatientDetailsHeader>{header}</PatientDetailsHeader>
      <TwoColumnContainer>{primaryDetails}</TwoColumnContainer>
      <Spacer />
      {children}
      <Spacer />
      <TwoColumnContainer>
        <p>{`Printed by: ${currentUser ? currentUser.displayName : ''}`}</p>
        <p>{`Printing date: ${new Date().toLocaleDateString()}`}</p>
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
      <Spacer />
      {footer}
      <Spacer />
    </div>
  );
}
