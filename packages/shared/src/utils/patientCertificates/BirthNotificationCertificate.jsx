import React from 'react';
import { Document, Page, StyleSheet, View } from '@react-pdf/renderer';
import { Box, CertificateHeader, styles, Watermark } from './Layout';
import { P } from './Typography';
import { LetterheadSection } from './LetterheadSection';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  sexOptions,
} from '@tamanu/web-frontend/app/constants';
import { getDisplayDate } from './getDisplayDate';

const customStyles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    border: '1px solid black',
  },
  titleRow: {
    flex: 1,
  },
  singleRow: {
    flex: 1,
  },
  doubleRowLargeLeft: {
    flex: 1,
  },
  doubleRowEvenSpread: {
    flex: 1,
  },
  tripleRow: {
    flex: 1,
  },
});

const Cell = props => <View {...props} style={customStyles.cell} />;
const TitleRow = props => <View {...props} style={customStyles.cell} />;
const SingleRow = props => <View {...props} style={customStyles.cell} />;
const DoubleRowLargeLeft = props => <View {...props} style={customStyles.cell} />;
const DoubleRowEvenSpread = props => <View {...props} style={customStyles.cell} />;
const TripleRow = props => <View {...props} style={customStyles.cell} />;

const KeyCell = ({ children }) => (
  <Cell>
    <P bold>{children}</P>
  </Cell>
);
const ValueCell = ({ children }) => (
  <Cell>
    <P>{children}</P>
  </Cell>
);

const getLabelFromValue = (mapping, v) => v;

const getFullName = patient => `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`;

const ChildSection = ({ data }) => {
  const shouldDisplayDeath = data?.deathData?.fetalOrInfant?.stillborn;

  return (
    <Box>
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
        <ValueCell>{data?.dateOfBirth ? getDisplayDate(data?.dateOfBirth) : ''}</ValueCell>
        <KeyCell>Birth time</KeyCell>
        <ValueCell>
          {data?.birthData?.timeOfBirth ? getDisplayDate(data?.birthData?.timeOfBirth) : ''}
        </ValueCell>
      </TripleRow>
      <SingleRow>
        <KeyCell>Place of birth</KeyCell>
        <ValueCell>
          {getLabelFromValue(PLACE_OF_BIRTH_OPTIONS, data?.birthData?.registeredBirthPlace)}
        </ValueCell>
      </SingleRow>
      <DoubleRowEvenSpread>
        <KeyCell>Sex</KeyCell>
        <ValueCell>{getLabelFromValue(sexOptions, data?.sex)}</ValueCell>
        <KeyCell>Ethnicity</KeyCell>
        <ValueCell>{data?.ethnicity?.name}</ValueCell>
      </DoubleRowEvenSpread>
      <DoubleRowEvenSpread>
        <KeyCell>Attendant at birth</KeyCell>
        <ValueCell>
          {getLabelFromValue(ATTENDANT_OF_BIRTH_OPTIONS, data?.birthData?.attendantAtBirth)}
        </ValueCell>
        <KeyCell>Name of attendant</KeyCell>
        <ValueCell>{data?.birthData?.nameOfAttendantAtBirth}</ValueCell>
      </DoubleRowEvenSpread>
      {shouldDisplayDeath ? (
        <SingleRow>
          <KeyCell>Cause of foetal death</KeyCell>
          <ValueCell>{data?.deathData?.causes?.primary?.condition?.name}</ValueCell>
        </SingleRow>
      ) : null}
    </Box>
  );
};

export const BirthNotificationCertificate = ({
  motherData,
  fatherData,
  childData,
  facility,
  certificateData,
  getLocalisation,
}) => {
  const { title, subTitle, logo, watermark } = certificateData;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark && <Watermark src={watermark} />}
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logo}
            certificateTitle="Birth Notification"
          />
        </CertificateHeader>
        <ChildSection data={childData} />
      </Page>
    </Document>
  );
};
