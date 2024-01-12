import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, styles, Watermark } from './Layout';
import { getCurrentDateString, ageInYears } from '../dateTime';
import { LetterheadSection } from './LetterheadSection';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  maritalStatusOptions,
  PLACE_OF_BIRTH_OPTIONS,
  sexOptions,
} from '@tamanu/web-frontend/app/constants';
import { getDisplayDate } from './getDisplayDate';
import { Footer } from './printComponents/Footer';
import { HorizontalRule } from './printComponents/HorizontalRule';

const borderStyle = '1 solid black';

const tableStyles = StyleSheet.create({
  table: {
    flexDirection: 'column',
    marginBottom: 10,
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

const Table = props => <View style={tableStyles.table} {...props} />;
const Row = props => <View style={tableStyles.row} {...props} />;
const P = props => <Text style={[tableStyles.p]} {...props} />;

const FlexCell = ({ children, ...props }) => (
  <View style={[tableStyles.baseCell, tableStyles.flexCell]} {...props}>
    <P>{children}</P>
  </View>
);

const Cell = ({ children, width = 100, ...props }) => (
  <View style={[tableStyles.baseCell, { width }]} {...props}>
    <P>{children}</P>
  </View>
);

const LeftCell = ({ children, ...props }) => (
  <View style={[tableStyles.baseCell, tableStyles.leftCell]} {...props}>
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
        <FlexCell>Child</FlexCell>
      </Row>
      <Row>
        <LeftCell>Name (if known)</LeftCell>
        <FlexCell>{getFullName(data)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Gestation (weeks)</LeftCell>
        <Cell width={50}>{data?.birthData?.gestationalAgeEstimate}</Cell>
        <Cell width={80}>Delivery type</Cell>
        <Cell width={70}>
          {getLabelFromValue(BIRTH_DELIVERY_TYPE_OPTIONS, data?.birthData?.birthDeliveryType)}
        </Cell>
        <Cell width={100}>Single/plural births</Cell>
        <FlexCell>{getLabelFromValue(BIRTH_TYPE_OPTIONS, data?.birthData?.birthType)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Birth Weight (kg)</LeftCell>
        <Cell width={50}>{data?.birthData?.birthWeight}</Cell>
        <Cell width={80}>Birth date</Cell>
        <Cell width={70}>{data?.dateOfBirth ? getDisplayDate(data?.dateOfBirth) : ''}</Cell>
        <Cell width={100}>Birth time</Cell>
        <FlexCell>
          {data?.birthData?.timeOfBirth ? getDisplayDate(data?.birthData?.timeOfBirth) : ''}
        </FlexCell>
      </Row>
      <Row>
        <LeftCell>Place of birth</LeftCell>
        <FlexCell>
          {getLabelFromValue(PLACE_OF_BIRTH_OPTIONS, data?.birthData?.registeredBirthPlace)}
        </FlexCell>
      </Row>
      <Row>
        <LeftCell>Sex</LeftCell>
        <Cell width={130}>{getLabelFromValue(sexOptions, data?.sex)}</Cell>
        <FlexCell>Ethnicity</FlexCell>
        <FlexCell>{data?.ethnicity?.name}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Attendant at birth</LeftCell>
        <Cell width={130}>
          {getLabelFromValue(ATTENDANT_OF_BIRTH_OPTIONS, data?.birthData?.attendantAtBirth)}
        </Cell>
        <FlexCell>Name of attendant</FlexCell>
        <FlexCell>{data?.birthData?.nameOfAttendantAtBirth}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Cause of foetal death</LeftCell>
        <FlexCell>{causeOfDeath}</FlexCell>
      </Row>
    </Table>
  );
};

const ParentSection = ({ parentType, data = {} }) => {
  return (
    <Table>
      <Row>
        <FlexCell>{parentType}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Name</LeftCell>
        <FlexCell>{getFullName(data)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Ethnicity</LeftCell>
        <Cell>{data?.ethnicity?.name}</Cell>
        <Cell>Marital status</Cell>
        <FlexCell>
          {getLabelFromValue(maritalStatusOptions, data?.additionalData?.maritalStatus)}
        </FlexCell>
      </Row>
      <Row>
        <LeftCell>Date of birth</LeftCell>
        <Cell>{data?.dateOfBirth ? getDisplayDate(data?.dateOfBirth) : ''}</Cell>
        <Cell>Age</Cell>
        <FlexCell>{data?.dateOfBirth ? ageInYears(data.dateOfBirth) : ''}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Occupation</LeftCell>
        <Cell>{data?.occupation?.name}</Cell>
        <Cell>Patient ID</Cell>
        <FlexCell>{data?.displayId}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Address</LeftCell>
        <FlexCell>{data?.additionalData?.streetVillage}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Mother&apos;s name</LeftCell>
        <FlexCell>{getFullName(data?.mother)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Father&apos;s name</LeftCell>
        <FlexCell>{getFullName(data?.father)}</FlexCell>
      </Row>
    </Table>
  );
};

const signatureStyles = StyleSheet.create({
  leftCell: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingRight: 10,
  },
  rightCell: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingLeft: 10,
  },
  line: {
    flex: 1,
    marginLeft: 10,
  },
});

const SignatureSection = () => {
  return (
    <View style={{ flexDirection: 'row', marginTop: 20 }}>
      <View style={{ flex: 1 }}>
        <View style={signatureStyles.leftCell}>
          <P>Certified correct by:</P>
          <HorizontalRule style={signatureStyles.line} />
        </View>
        <View style={signatureStyles.leftCell}>
          <P>Circle applicable:</P>
          <P>Doctor/midwife/nurse</P>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={signatureStyles.rightCell}>
          <P>Signed:</P>
          <HorizontalRule style={signatureStyles.line} />
        </View>
        <View style={signatureStyles.rightCell}>
          <P>Date:</P>
          <HorizontalRule style={signatureStyles.line} />
        </View>
      </View>
    </View>
  );
};

const topStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  cell: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  key: {
    fontSize: 9,
  },
  value: {
    fontSize: 9,
  },
});

const TopSection = ({ facilityName, childDisplayId }) => {
  const date = getCurrentDateString();
  return (
    <View style={topStyles.container}>
      <View style={topStyles.cell}>
        <P style={topStyles.key}>Facility:</P>
        <P style={topStyles.value}>Etta Clinic</P>
      </View>
      <View style={topStyles.cell}>
        <P style={topStyles.key}>Notification date:</P>
        <P style={topStyles.value}>{getDisplayDate(date)}</P>
      </View>
      <View style={topStyles.cell}>
        <P style={topStyles.key}>Child ID:</P>
        <P style={topStyles.value}>{childDisplayId}</P>
      </View>
    </View>
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
        <TopSection facility={facility?.name} childDisplayId={childData?.displayId} />
        <ParentSection parentType="Mother" data={motherData} />
        <ParentSection parentType="Father" data={fatherData} />
        <ChildSection data={childData} />
        <SignatureSection />
        <Footer />
      </Page>
    </Document>
  );
};
