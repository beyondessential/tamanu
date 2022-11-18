import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Divider from '@material-ui/core/Divider';

import { ageInYears, getCurrentDateString } from 'shared/utils/dateTime';

import { Typography, Box } from '@material-ui/core';
import { DateDisplay } from '../DateDisplay';
import { PrintLetterhead } from './PrintLetterhead';
import { CertificateWrapper } from './CertificateWrapper';
import {
  Colors,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  ATTENDANT_OF_BIRTH_OPTIONS,
  sexOptions,
  maritalStatusOptions,
} from '../../constants';

const ContentWrapper = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 58px;
  margin-left: 57px;
`;

const TopSection = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
`;

const Table = styled(Box)`
  border-left: 2px solid black;
  border-top: 2px solid black;
  border-right: 1px solid black;
  border-bottom: 1px solid black;
  margin-top: 10px;
  margin-bottom: 16px;
`;

const Row = styled(Box)`
  display: grid;
  border-bottom: 0.5px solid black;
`;

const Cell = styled(Box)`
  border-right: 0.5px solid black;
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
`;

const Text = styled(Typography)`
  font-size: 12px;
  padding-left: 0.5rem;
`;

const StrongText = styled(Text)`
  font-weight: 600;
`;

const SignatureText = styled(Typography)`
  font-weight: 500;
  display: inline;
  font-size: 14px;
  margin-left: 10px;
  margin-right: 20px;
`;

const SignatureLine = styled(Divider)`
  width: 230px;
  height: 100%;
  border-bottom: 1px solid ${Colors.darkestText};
`;

const BottomSideBySideContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-direction: row;
`;

const SignatureContainerGrid = styled.div`
  display: grid;

  margin-top: 0.3rem;
  grid-column-gap: 0.7rem;
  grid-row-gap: 1.2rem;

  grid-template-columns: 3fr 2fr;
  align-items: start;
`;

const TopTextContainer = styled.div`
  display: flex;
  flex-direction: row;
  white-space: nowrap;
`;

const TopData = ({ name, children }) => (
  <TopTextContainer>
    <StrongText style={{ fontSize: '14px', marginRight: '5px', marginLeft: '0px' }}>{`${name}:`}</StrongText>
    {children}
  </TopTextContainer>
);

const KeyCell = ({ children }) => (
  <Cell>
    <StrongText>{children}</StrongText>
  </Cell>
);
const ValueCell = ({ children }) => (
  <Cell>
    <Text>{children}</Text>
  </Cell>
);

const TitleRow = styled(Row)`
  border-bottom: 2px solid black;
  grid-template-columns: 1fr;
`;
const SingleRow = styled(Row)`
  grid-template-columns: ${125 / 480}fr ${355 / 480}fr;
`;
const DoubleRow1 = styled(Row)`
  grid-template-columns: ${125 / 480}fr ${167 / 480}fr ${87 / 480}fr ${101 / 480}fr;
`;
const DoubleRow2 = styled(Row)`
  grid-template-columns: ${125 / 480}fr ${119 / 480}fr ${101 / 480}fr ${135 / 480}fr;
`;
const TripleRow = styled(Row)`
  grid-template-columns: ${125 / 480}fr ${47 / 480}fr ${72 / 480}fr ${71 / 480}fr ${101 / 480}fr ${64 /
      480}fr;
`;

const getLabelFromValue = (mapping, v) =>
  v ? mapping.find(({ value }) => v === value)?.label ?? v : '';

const getFullName = patient => `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`;

const ParentSection = ({ parentType, data = {} }) => {
  return (
    <Table>
      <TitleRow>
        <KeyCell>{parentType}</KeyCell>
      </TitleRow>
      <SingleRow>
        <KeyCell>Name</KeyCell>
        <ValueCell>{getFullName(data)}</ValueCell>
      </SingleRow>
      <DoubleRow1>
        <KeyCell>Ethnicity</KeyCell>
        <ValueCell>{data?.ethnicity?.name}</ValueCell>
        <KeyCell>Marital status</KeyCell>
        <ValueCell>
          {getLabelFromValue(maritalStatusOptions, data?.additionalData?.maritalStatus)}
        </ValueCell>
      </DoubleRow1>
      <DoubleRow1>
        <KeyCell>Date of birth</KeyCell>
        <ValueCell>{data?.dateOfBirth ? <DateDisplay date={data?.dateOfBirth} /> : ''}</ValueCell>
        <KeyCell>Age</KeyCell>
        <ValueCell>{data?.dateOfBirth ? ageInYears(data.dateOfBirth) : ''}</ValueCell>
      </DoubleRow1>
      <DoubleRow1>
        <KeyCell>Occupation</KeyCell>
        <ValueCell>{data?.occupation?.name}</ValueCell>
        <KeyCell>Patient ID</KeyCell>
        <ValueCell>{data?.displayId}</ValueCell>
      </DoubleRow1>
      <SingleRow>
        <KeyCell>Address</KeyCell>
        <ValueCell>{data?.additionalData?.streetVillage}</ValueCell>
      </SingleRow>
      <SingleRow>
        <KeyCell>Mother&apos;s name</KeyCell>
        <ValueCell>{getFullName(data?.mother)}</ValueCell>
      </SingleRow>
      <SingleRow>
        <KeyCell>Father&apos;s name</KeyCell>
        <ValueCell>{getFullName(data?.father)}</ValueCell>
      </SingleRow>
    </Table>
  );
};

const BirthSection = ({ data }) => {
  const shouldDisplayDeath = data?.deathData?.fetalOrInfant?.stillborn;

  return (
    <Table>
      <TitleRow>
        <KeyCell>Child</KeyCell>
      </TitleRow>
      <SingleRow>
        <KeyCell>Name (if known)</KeyCell>
        <ValueCell>{getFullName(data)}</ValueCell>
      </SingleRow>
      <TripleRow>
        <KeyCell>Gestation (weeks)</KeyCell>
        <ValueCell>{data?.birthData?.gestationalAgeEstimate}</ValueCell>
        <KeyCell>Delivery type</KeyCell>
        <ValueCell>
          {getLabelFromValue(BIRTH_DELIVERY_TYPE_OPTIONS, data?.birthData?.birthDeliveryType)}
        </ValueCell>
        <KeyCell>Single/plural births</KeyCell>
        <ValueCell>{getLabelFromValue(BIRTH_TYPE_OPTIONS, data?.birthData?.birthType)}</ValueCell>
      </TripleRow>
      <TripleRow>
        <KeyCell>Birth Weight (kg)</KeyCell>
        <ValueCell>{data?.birthData?.birthWeight}</ValueCell>
        <KeyCell>Birth date</KeyCell>
        <ValueCell>{data?.dateOfBirth ? <DateDisplay date={data?.dateOfBirth} /> : ''}</ValueCell>
        <KeyCell>Birth time</KeyCell>
        <ValueCell>
          {data?.birthData?.timeOfBirth ? (
            <DateDisplay showDate={false} showTime date={data?.birthData?.timeOfBirth} />
          ) : (
            ''
          )}
        </ValueCell>
      </TripleRow>
      <SingleRow>
        <KeyCell>Place of birth</KeyCell>
        <ValueCell>
          {getLabelFromValue(PLACE_OF_BIRTH_OPTIONS, data?.birthData?.registeredBirthPlace)}
        </ValueCell>
      </SingleRow>
      <DoubleRow2>
        <KeyCell>Sex</KeyCell>
        <ValueCell>{getLabelFromValue(sexOptions, data?.sex)}</ValueCell>
        <KeyCell>Ethnicity</KeyCell>
        <ValueCell>{data?.ethnicity?.name}</ValueCell>
      </DoubleRow2>
      <DoubleRow2>
        <KeyCell>Attendant at birth</KeyCell>
        <ValueCell>
          {getLabelFromValue(ATTENDANT_OF_BIRTH_OPTIONS, data?.birthData?.attendantAtBirth)}
        </ValueCell>
        <KeyCell>Name of attendant</KeyCell>
        <ValueCell>{data?.birthData?.nameOfAttendantAtBirth}</ValueCell>
      </DoubleRow2>
      {shouldDisplayDeath ? (
        <SingleRow>
          <KeyCell>Cause of foetal death</KeyCell>
          <ValueCell>{data?.deathData?.causes?.primary?.condition?.name}</ValueCell>
        </SingleRow>
      ) : null}
    </Table>
  );
};

export const BirthNotificationCertificate = React.memo(
  ({ motherData, fatherData, childData, facility, certificateData }) => {
    const { title, subTitle, logo } = certificateData;

    return (
      <CertificateWrapper>
        <PrintLetterhead
          title={title}
          subTitle={subTitle}
          logoSrc={logo}
          pageTitle="Birth Notification"
        />
        <TopSection>
          <TopData name="Facility">{facility?.name}</TopData>
          <TopData name="Notification date">
            <DateDisplay date={getCurrentDateString()} />
          </TopData>
          <TopData name="Child ID">{childData?.displayId}</TopData>
        </TopSection>
        <ParentSection parentType="Mother" data={motherData} />
        <ParentSection parentType="Father" data={fatherData} />
        <BirthSection data={childData} />
        <SignatureContainerGrid>
          <BottomSideBySideContainer>
            <SignatureText>Certified correct by:</SignatureText>
            <SignatureLine />
          </BottomSideBySideContainer>
          <BottomSideBySideContainer>
            <SignatureText>Signed:</SignatureText>
            <SignatureLine />
          </BottomSideBySideContainer>
        </SignatureContainerGrid>
        <SignatureContainerGrid>
          <BottomSideBySideContainer>
            <SignatureText>Circle applicable:</SignatureText>
            <SignatureText>Doctor/midwife/nurse</SignatureText>
          </BottomSideBySideContainer>
          <BottomSideBySideContainer>
            <SignatureText>Date:</SignatureText>
            <SignatureLine />
          </BottomSideBySideContainer>
        </SignatureContainerGrid>
      </CertificateWrapper>
    );
  },
);

BirthNotificationCertificate.propTypes = {
  motherData: PropTypes.object.isRequired,
  fatherData: PropTypes.object.isRequired,
  childData: PropTypes.object.isRequired,
  facility: PropTypes.object.isRequired,
  certificateData: PropTypes.object.isRequired,
};
