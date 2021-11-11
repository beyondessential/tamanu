import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { getCurrentUser } from '../../store/auth';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';
import { PrintLetterhead } from './Letterhead';
import { DateDisplay } from '../DateDisplay';

export const Spacer = styled.div`
  margin-top: 3rem;
`;

export const Table = styled.table`
  border: 1px solid ${Colors.darkText};
  border-collapse: collapse;

  thead {
    font-weight: bold;
  }
  th,
  td {
    padding: 5px 10px;
    border: 1px solid ${Colors.darkText};
  }
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
  dateOfBirth: ({ dateOfBirth }) => (
    <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
  ),
  placeOfBirth: ({ additionalData }) => additionalData?.placeOfBirth,
  countryOfBirthId: ({ additionalData }) => additionalData?.countryOfBirth?.name,
  sex: null,
  Mother: () => null, // TODO: not populated
  displayId: null,
};

const UserEntrySection = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: 20px;
`;

const UnderlineP = styled.p`
  text-decoration: underline;
`;

const CertificateWrapper = styled.div`
  ${props =>
    props.watermark && props.watermarkType
      ? `background: linear-gradient(rgb(243, 245, 247,.9), rgb(243, 245, 247,.9)), url("data:${props.watermarkType};base64,${props.watermark}");
      background-repeat: no-repeat;
      background-attachment: scroll;
      background-position: center;
      background-size: 70%;`
      : ''}
`;

const UnderlineEmptySpace = () => <UnderlineP>{new Array(100).fill('\u00A0')}</UnderlineP>;

export const Certificate = ({
  patient,
  header,
  footer = null,
  watermark,
  watermarkType,
  primaryDetailsFields,
  children,
}) => {
  const currentUser = useSelector(getCurrentUser);
  const { getLocalisation } = useLocalisation();
  const detailsFieldsToDisplay =
    primaryDetailsFields ||
    Object.keys(PRIMARY_DETAILS_FIELDS).filter(
      ([name]) => getLocalisation(`fields.${name}.hidden`) !== true,
    );
  return (
    <CertificateWrapper watermark={watermark} watermarkType={watermarkType}>
      <PrintLetterhead />
      <Spacer />
      <PatientDetailsHeader>{header}</PatientDetailsHeader>
      <TwoColumnContainer>
        {detailsFieldsToDisplay.map(field => {
          const accessor = PRIMARY_DETAILS_FIELDS[field];
          const label = getLocalisation(`fields.${field}.shortLabel`) || field;
          const value = (accessor ? accessor(patient) : patient[field]) || '';
          return (
            <p key={field}>
              <span>{`${label}: `}</span>
              <span>{value}</span>
            </p>
          );
        })}
      </TwoColumnContainer>
      <Spacer />
      {children}
      <Spacer />
      <TwoColumnContainer>
        <p>{`Printed by: ${currentUser ? currentUser.displayName : ''}`}</p>
        <p>
          <span>Printing date: </span>
          <DateDisplay date={new Date()} />
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
      <Spacer />
      {footer}
      <Spacer />
    </CertificateWrapper>
  );
};
