import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { getCurrentUser } from '../../store/auth';
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

const PRIMARY_DETAILS_FIELDS = {
  firstName: null,
  lastName: null,
  dateOfBirth: ({ dateOfBirth }) => new Date(dateOfBirth).toLocaleDateString(),
  placeOfBirth: ({ additionalData }) => additionalData?.placeOfBirth,
  countryOfBirthId: ({ additionalData }) => additionalData?.countryOfBirth?.name,
  sex: null,
  Mother: () => null, // TODO: not populated
};

const UserEntrySection = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: 20px;
`;

const UnderlineP = styled.p`
  text-decoration: underline;
`;

const UnderlineEmptySpace = () => <UnderlineP>{new Array(100).fill('\u00A0')}</UnderlineP>;

export const Certificate = ({ patient, header, footer = null, primaryDetailsFields, children }) => {
  const currentUser = useSelector(getCurrentUser);
  const { getLocalisation } = useLocalisation();
  const detailsFieldsToDisplay =
    primaryDetailsFields ||
    Object.keys(PRIMARY_DETAILS_FIELDS).filter(
      ([name]) => getLocalisation(`fields.${name}.hidden`) !== true,
    );
  return (
    <div>
      <PrintLetterhead />
      <Spacer />
      <PatientDetailsHeader>{header}</PatientDetailsHeader>
      <TwoColumnContainer>
        {detailsFieldsToDisplay.map(field => {
          const accessor = PRIMARY_DETAILS_FIELDS[field];
          const label = getLocalisation(`fields.${field}.shortLabel`) || field;
          const value = (accessor ? accessor(patient) : patient[field]) || '';
          return <p key={field}>{`${label}: ${value}`}</p>;
        })}
      </TwoColumnContainer>
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
};
