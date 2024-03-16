import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { CertificateHeader, styles, Watermark } from './Layout';
import { ageInYears, getCurrentDateString } from '../dateTime';
import { LetterheadSection } from './LetterheadSection';
import {
  ATTENDANT_OF_BIRTH_OPTIONS,
  BIRTH_DELIVERY_TYPE_OPTIONS,
  BIRTH_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PLACE_OF_BIRTH_OPTIONS,
  SEX_OPTIONS,
} from '@tamanu/constants';
import { Footer } from './printComponents/Footer';
import { getDisplayDate } from './getDisplayDate';
import { CustomStyleSheet } from '../renderPdf';
import { useLanguageContext, withLanguageContext } from '../languageContext';

const borderStyle = '1 solid black';

const topStyles = CustomStyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  cell: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  key: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginRight: 2,
  },
  value: {
    fontSize: 9,
  },
});

const TopSection = ({ facilityName, childDisplayId }) => {
  const { language } = useLanguageContext();
  const date = getCurrentDateString();
  return (
    <View style={topStyles().container}>
      <View style={topStyles().cell}>
        <P style={topStyles(language).key}>Facility:</P>
        <P style={topStyles().value}>{facilityName}</P>
      </View>
      <View style={topStyles().cell}>
        <P style={topStyles(language).key}>Notification date:</P>
        <P style={topStyles().value}>{getDisplayDate(date)}</P>
      </View>
      <View style={topStyles().cell}>
        <P style={topStyles(language).key}>Child ID:</P>
        <P style={topStyles().value}>{childDisplayId}</P>
      </View>
    </View>
  );
};

const tableStyles = CustomStyleSheet.create({
  table: {
    flexDirection: 'column',
    marginBottom: 15,
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
    fontSize: 9,
  },
  fontBold: {
    fontFamily: 'Helvetica-Bold',
  },
});

const Table = props => <View style={tableStyles().table} {...props} />;
const Row = props => <View style={tableStyles().row} {...props} />;
const P = ({ style = {}, bold, children }) => {
  const { language } = useLanguageContext();
  return (
    <Text
      style={[tableStyles(language).p, style, ...(bold ? [styles(language, true).fontBold] : [])]}
    >
      {children}
    </Text>
  );
};

const FlexCell = ({ children, style = {}, bold = false }) => (
  <View style={[tableStyles().baseCell, tableStyles().flexCell, style]}>
    <P bold={bold}>{children}</P>
  </View>
);

const Cell = ({ children, style = {}, bold }) => (
  <View style={[tableStyles().baseCell, style]}>
    <P bold={bold}>{children}</P>
  </View>
);

const LeftCell = ({ children }) => (
  <View style={[tableStyles().baseCell, tableStyles().leftCell]}>
    <P bold>{children}</P>
  </View>
);

const getLabelFromValue = (mapping, v) => {
  const entry = mapping.find(e => e.value === v);
  return entry ? entry.label : '';
};

const getFullName = patient => `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`;

const ChildSection = ({ data }) => {
  const causeOfDeath = data?.deathData?.causes?.primary?.condition?.name ?? 'N/A';
  return (
    <Table>
      <Row>
        <FlexCell bold>Child</FlexCell>
      </Row>
      <Row>
        <LeftCell>Name (if known)</LeftCell>
        <FlexCell>{getFullName(data)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Gestation (weeks)</LeftCell>
        <Cell style={{ width: 50 }}>{data?.birthData?.gestationalAgeEstimate}</Cell>
        <Cell style={{ width: 80 }} bold>
          Delivery type
        </Cell>
        <Cell style={{ width: 70 }}>
          {getLabelFromValue(BIRTH_DELIVERY_TYPE_OPTIONS, data?.birthData?.birthDeliveryType)}
        </Cell>
        <Cell style={{ width: 100 }} bold>
          Single/plural births
        </Cell>
        <FlexCell>{getLabelFromValue(BIRTH_TYPE_OPTIONS, data?.birthData?.birthType)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Birth Weight (kg)</LeftCell>
        <Cell style={{ width: 50 }}>{data?.birthData?.birthWeight}</Cell>
        <Cell style={{ width: 80 }} bold>
          Birth date
        </Cell>
        <Cell style={{ width: 70 }}>
          {data?.dateOfBirth ? getDisplayDate(data?.dateOfBirth) : ''}
        </Cell>
        <Cell style={{ width: 100 }} bold>
          Birth time
        </Cell>
        <FlexCell>
          {data?.birthData?.timeOfBirth
            ? getDisplayDate(data?.birthData?.timeOfBirth, 'hh:mm a')
            : ''}
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
        <Cell style={{ width: 130 }}>{getLabelFromValue(SEX_OPTIONS, data?.sex)}</Cell>
        <FlexCell bold>Ethnicity</FlexCell>
        <FlexCell>{data?.ethnicity?.name}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Attendant at birth</LeftCell>
        <Cell style={{ width: 130 }}>
          {getLabelFromValue(ATTENDANT_OF_BIRTH_OPTIONS, data?.birthData?.attendantAtBirth)}
        </Cell>
        <FlexCell bold>Name of attendant</FlexCell>
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
        <FlexCell bold>{parentType}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Name</LeftCell>
        <FlexCell>{getFullName(data)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Ethnicity</LeftCell>
        <Cell style={{ width: 150 }}>{data?.ethnicity?.name}</Cell>
        <Cell style={{ width: 90 }} bold>
          Marital status
        </Cell>
        <FlexCell>
          {getLabelFromValue(MARITAL_STATUS_OPTIONS, data?.additionalData?.maritalStatus)}
        </FlexCell>
      </Row>
      <Row>
        <LeftCell>Date of birth</LeftCell>
        <Cell style={{ width: 150 }}>
          {data?.dateOfBirth ? getDisplayDate(data?.dateOfBirth) : ''}
        </Cell>
        <Cell style={{ width: 90 }} bold>
          Age
        </Cell>
        <FlexCell>{data?.dateOfBirth ? ageInYears(data.dateOfBirth) : ''}</FlexCell>
      </Row>
      <Row>
        <LeftCell>Occupation</LeftCell>
        <Cell style={{ width: 150 }}>{data?.occupation?.name}</Cell>
        <Cell style={{ width: 90 }} bold>
          Patient ID
        </Cell>
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

const signatureStyles = CustomStyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 10,
  },
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
  leftText: {
    width: 90,
    marginRight: 10,
    fontFamily: 'Helvetica-Bold',
  },
  rightText: {
    width: 30,
    marginRight: 10,
    fontFamily: 'Helvetica-Bold',
  },
  line: {
    flex: 1,
    borderBottom: '1 solid black',
  },
});

const SignatureSection = () => {
  const { language } = useLanguageContext();
  return (
    <View style={signatureStyles().container}>
      <View style={{ flex: 1 }}>
        <View style={signatureStyles().leftCell}>
          <P style={signatureStyles(language).leftText}>Certified correct by:</P>
          <View style={signatureStyles().line} />
        </View>
        <View style={signatureStyles().leftCell}>
          <P style={signatureStyles(language).leftText}>Circle applicable:</P>
          <P bold>Doctor/midwife/nurse</P>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={signatureStyles().rightCell}>
          <P style={signatureStyles(language).rightText}>Signed:</P>
          <View style={signatureStyles().line} />
        </View>
        <View style={signatureStyles().rightCell}>
          <P style={signatureStyles().rightText}>Date:</P>
          <View style={signatureStyles().line} />
        </View>
      </View>
    </View>
  );
};

const BirthNotificationCertificateComponent = ({
  motherData,
  fatherData,
  childData,
  facility,
  certificateData,
  getLocalisation,
}) => {
  const { language } = useLanguageContext();
  const { logo, watermark } = certificateData;

  return (
    <Document>
      <Page size="A4" style={styles(language).page}>
        {watermark && <Watermark src={watermark} />}
        <CertificateHeader>
          <LetterheadSection
            getLocalisation={getLocalisation}
            logoSrc={logo}
            certificateTitle="Birth Notification"
          />
        </CertificateHeader>
        <TopSection facilityName={facility?.name} childDisplayId={childData?.displayId} />
        <ParentSection parentType="Mother" data={motherData} />
        <ParentSection parentType="Father" data={fatherData} />
        <ChildSection data={childData} />
        <SignatureSection />
        <Footer />
      </Page>
    </Document>
  );
};

export const BirthNotificationCertificate = withLanguageContext(
  BirthNotificationCertificateComponent,
);
