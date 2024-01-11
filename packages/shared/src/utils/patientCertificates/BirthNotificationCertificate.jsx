import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, styles, Watermark } from './Layout';
import { LetterheadSection } from './LetterheadSection';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  sexOptions,
} from '@tamanu/web-frontend/app/constants';
import { getDisplayDate } from './getDisplayDate';

const borderStyle = '1 solid black';

const customStyles = StyleSheet.create({
  table: {
    flex: 1,
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTop: borderStyle,
    borderBottom: borderStyle,
    borderRight: borderStyle,
    marginBottom: -1,
  },
  baseCell: {
    flexDirection: 'row',
    borderLeft: borderStyle,
    alignItems: 'center',
    padding: 5,
  },
  flexCell: {
    flex: 1,
  },
  leftCell: {
    width: '125pt',
  },
  p: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    fontWeight: 400,
    marginBottom: 0,
  },
});

const Table = props => <View style={customStyles.table} {...props} />;
const Row = props => <View style={customStyles.row} {...props} />;
const P = props => <Text style={[customStyles.p]} {...props} />;

const Cell = ({ children, ...props }) => (
  <View style={[customStyles.baseCell, customStyles.flexCell]} {...props}>
    <P>{children}</P>
  </View>
);

const WidthCell = ({ children, width = 100, ...props }) => (
  <View style={[customStyles.baseCell, { width }]} {...props}>
    <P>{children}</P>
  </View>
);

const LeftCell = ({ children, ...props }) => (
  <View style={[customStyles.baseCell, customStyles.leftCell]} {...props}>
    <P>{children}</P>
  </View>
);

const getLabelFromValue = (mapping, v) => v;

const getFullName = patient => `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`;

const ChildSection = ({ data }) => {
  const causeOfDeath = data?.deathData?.causes?.primary?.condition?.name ?? 'N/A';
  return (
    <Table>
      <Row>
        <Cell>Child</Cell>
      </Row>
      <Row>
        <LeftCell>Name (if known)</LeftCell>
        <Cell>{getFullName(data)}</Cell>
      </Row>
      <Row>
        <LeftCell>Gestation (weeks)</LeftCell>
        <WidthCell width={50}>{data?.birthData?.gestationalAgeEstimate}</WidthCell>
        <WidthCell width={80}>Delivery type</WidthCell>
        <WidthCell width={70}>
          {getLabelFromValue(BIRTH_DELIVERY_TYPE_OPTIONS, data?.birthData?.birthDeliveryType)}
        </WidthCell>
        <WidthCell width={100}>Single/plural births</WidthCell>
        <Cell>{getLabelFromValue(BIRTH_TYPE_OPTIONS, data?.birthData?.birthType)}</Cell>
      </Row>
      <Row>
        <LeftCell>Birth Weight (kg)</LeftCell>
        <WidthCell width={50}>{data?.birthData?.birthWeight}</WidthCell>
        <WidthCell width={80}>Birth date</WidthCell>
        <WidthCell width={70}>
          {data?.dateOfBirth ? getDisplayDate(data?.dateOfBirth) : ''}
        </WidthCell>
        <WidthCell width={100}>Birth time</WidthCell>
        <Cell>
          {data?.birthData?.timeOfBirth ? getDisplayDate(data?.birthData?.timeOfBirth) : ''}
        </Cell>
      </Row>
      <Row>
        <LeftCell>Place of birth</LeftCell>
        <Cell>
          {getLabelFromValue(PLACE_OF_BIRTH_OPTIONS, data?.birthData?.registeredBirthPlace)}
        </Cell>
      </Row>
      <Row>
        <LeftCell>Sex</LeftCell>
        <WidthCell width={130}>{getLabelFromValue(sexOptions, data?.sex)}</WidthCell>
        <Cell>Ethnicity</Cell>
        <Cell>{data?.ethnicity?.name}</Cell>
      </Row>
      <Row>
        <LeftCell>Attendant at birth</LeftCell>
        <WidthCell width={130}>
          {getLabelFromValue(ATTENDANT_OF_BIRTH_OPTIONS, data?.birthData?.attendantAtBirth)}
        </WidthCell>
        <Cell>Name of attendant</Cell>
        <Cell>{data?.birthData?.nameOfAttendantAtBirth}</Cell>
      </Row>
      <Row>
        <LeftCell>Cause of foetal death</LeftCell>
        <Cell>{causeOfDeath}</Cell>
      </Row>
    </Table>
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
