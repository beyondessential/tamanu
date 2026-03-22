import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { CertificateHeader, styles, Watermark } from './Layout';
import { ageInYears } from '@tamanu/utils/dateTime';
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
import { getEthnicity } from '../patientAccessors';
import { useLanguageContext, withLanguageContext } from '../pdf/languageContext';
import { withDateTimeContext, useDateTime } from '../pdf/withDateTimeContext';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';
import { FSMBirthNotificationCertificate } from './FSMBirthNotificationCertificate';

const borderStyle = '1 solid black';

const topStyles = StyleSheet.create({
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
    marginRight: 2,
  },
  value: {
    fontSize: 9,
  },
});

const TopSection = ({ facilityName, childDisplayId }) => {
  const { formatShort, getCurrentDate } = useDateTime();
  return (
    <View style={topStyles.container}>
      <View style={topStyles.cell}>
        <P style={topStyles.key}>Facility:</P>
        <P style={topStyles.value}>{facilityName}</P>
      </View>
      <View style={topStyles.cell}>
        <P bold style={topStyles.key}>
          Notification date:
        </P>
        <P style={topStyles.value}>{formatShort(getCurrentDate())}</P>
      </View>
      <View style={topStyles.cell}>
        <P style={topStyles.key}>Child ID:</P>
        <P style={topStyles.value}>{childDisplayId}</P>
      </View>
    </View>
  );
};

const tableStyles = StyleSheet.create({
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
});

const Table = props => <View style={tableStyles.table} {...props} />;
const Row = props => <View style={tableStyles.row} {...props} />;
const P = ({ style = {}, bold, children }) => (
  <Text bold={bold} style={[tableStyles.p, style]}>
    {children}
  </Text>
);

const FlexCell = ({ children, style = {}, bold = false }) => (
  <View style={[tableStyles.baseCell, tableStyles.flexCell, style]}>
    <P bold={bold}>{children}</P>
  </View>
);

const Cell = ({ children, style = {}, bold }) => (
  <View style={[tableStyles.baseCell, style]}>
    <P bold={bold}>{children}</P>
  </View>
);

const LeftCell = ({ children }) => (
  <View style={[tableStyles.baseCell, tableStyles.leftCell]}>
    <P bold>{children}</P>
  </View>
);

const getLabelFromValue = (mapping, v) => {
  const entry = mapping.find(e => e.value === v);
  return entry ? entry.label : '';
};

const getFullName = patient => `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`;

const ChildSection = ({ data }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort, formatTime } = useDateTime();
  const causeOfDeath =
    data?.deathData?.causes?.primary?.condition?.name ??
    getTranslation('general.fallback.notApplicable', 'N/A');
  return (
    <Table>
      <Row>
        <FlexCell bold>{getTranslation('pdf.birthNotification.child.label', 'Child')}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('pdf.birthNotification.nameIfKnown.label', 'Name (if known)')}
        </LeftCell>
        <FlexCell>{getFullName(data)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('pdf.birthNotification.gestationWeeks.label', 'Gestation (weeks)')}
        </LeftCell>
        <Cell style={{ width: 50 }}>{data?.birthData?.gestationalAgeEstimate}</Cell>
        <Cell style={{ width: 80 }} bold>
          {getTranslation('general.localisedField.birthDeliveryType.label', 'Delivery type')}
        </Cell>
        <Cell style={{ width: 70 }}>
          {getLabelFromValue(BIRTH_DELIVERY_TYPE_OPTIONS, data?.birthData?.birthDeliveryType)}
        </Cell>
        <Cell style={{ width: 100 }} bold>
          {getTranslation('pdf.birthNotification.singlePluralBirths.label', 'Single/plural births')}
        </Cell>
        <FlexCell>{getLabelFromValue(BIRTH_TYPE_OPTIONS, data?.birthData?.birthType)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('pdf.birthNotification.birthWeightKg.label', 'Birth Weight (kg)')}
        </LeftCell>
        <Cell style={{ width: 50 }}>{data?.birthData?.birthWeight}</Cell>
        <Cell style={{ width: 80 }} bold>
          {getTranslation('pdf.birthNotification.birthDate.label', 'Birth date')}
        </Cell>
        <Cell style={{ width: 70 }}>
          {data?.dateOfBirth ? formatShort(data?.dateOfBirth) : ''}
        </Cell>
        <Cell style={{ width: 100 }} bold>
          {getTranslation('pdf.birthNotification.birthTime.label', 'Birth time')}
        </Cell>
        <FlexCell>
          {data?.birthData?.timeOfBirth
            ? formatTime(data?.birthData?.timeOfBirth)
            : ''}
        </FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('general.localisedField.registeredBirthPlace.label', 'Place of birth')}
        </LeftCell>
        <FlexCell>
          {getLabelFromValue(PLACE_OF_BIRTH_OPTIONS, data?.birthData?.registeredBirthPlace)}
        </FlexCell>
      </Row>
      <Row>
        <LeftCell>{getTranslation('general.localisedField.sex.label', 'Sex')}</LeftCell>
        <Cell style={{ width: 130 }}>{getLabelFromValue(SEX_OPTIONS, data?.sex)}</Cell>
        <FlexCell bold>
          {getTranslation('general.localisedField.ethnicityId.label', 'Ethnicity')}
        </FlexCell>
        <FlexCell>{getEthnicity(data)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('general.localisedField.attendantAtBirth.label', 'Attendant at birth')}
        </LeftCell>
        <Cell style={{ width: 130 }}>
          {getLabelFromValue(ATTENDANT_OF_BIRTH_OPTIONS, data?.birthData?.attendantAtBirth)}
        </Cell>
        <FlexCell bold>
          {getTranslation(
            'general.localisedField.nameOfAttendantAtBirth.label',
            'Name of attendant',
          )}
        </FlexCell>
        <FlexCell>{data?.birthData?.nameOfAttendantAtBirth}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation(
            'pdf.birthNotification.causeOfFoetalDeath.label',
            'Cause of foetal death',
          )}
        </LeftCell>
        <FlexCell>{causeOfDeath}</FlexCell>
      </Row>
    </Table>
  );
};

const ParentSection = ({ parentType, data = {} }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShort } = useDateTime();
  return (
    <Table>
      <Row>
        <FlexCell bold>{parentType}</FlexCell>
      </Row>
      <Row>
        <LeftCell>{getTranslation('general.name.label', 'Name')}</LeftCell>
        <FlexCell>{getFullName(data)}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('general.localisedField.ethnicityId.label', 'Ethnicity')}
        </LeftCell>
        <Cell style={{ width: 150 }}>{getEthnicity(data)}</Cell>
        <Cell style={{ width: 90 }} bold>
          {getTranslation('general.localisedField.nationalityId.label', 'Nationality')}
        </Cell>
        <FlexCell>{data?.additionalData?.nationality?.name}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('general.localisedField.dateOfBirth.label', 'Date of birth')}
        </LeftCell>
        <Cell style={{ width: 150 }}>
          {data?.dateOfBirth ? formatShort(data?.dateOfBirth) : ''}
        </Cell>
        <Cell style={{ width: 90 }} bold>
          {getTranslation('general.localisedField.maritalStatus.label', 'Marital status')}
        </Cell>
        <FlexCell>
          {getLabelFromValue(MARITAL_STATUS_OPTIONS, data?.additionalData?.maritalStatus)}
        </FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('general.localisedField.occupationId.label', 'Occupation')}
        </LeftCell>
        <Cell style={{ width: 150 }}>{data?.occupation?.name}</Cell>
        <Cell style={{ width: 90 }} bold>
          {getTranslation('pdf.birthNotification.age.label', 'Age')}
        </Cell>
        <FlexCell>{data?.dateOfBirth ? ageInYears(data.dateOfBirth) : ''}</FlexCell>
      </Row>
      <Row>
        <LeftCell>{getTranslation('pdf.birthNotification.address.label', 'Address')}</LeftCell>
        <Cell style={{ width: 150 }}>{data?.additionalData?.streetVillage}</Cell>
        <Cell style={{ width: 90 }} bold>
          {getTranslation('general.localisedField.villageId.label', 'Village')}
        </Cell>
        <FlexCell>{data?.village?.name}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('pdf.birthNotification.motherName.label', "Mother's name")}
        </LeftCell>
        <Cell style={{ width: 150 }}>{getFullName(data?.mother)}</Cell>
        <Cell style={{ width: 90 }} bold>
          {getTranslation('general.patientId.label', 'Patient ID')}
        </Cell>
        <FlexCell>{data?.displayId}</FlexCell>
      </Row>
      <Row>
        <LeftCell>
          {getTranslation('pdf.birthNotification.fatherName.label', "Father's name")}
        </LeftCell>
        <Cell style={{ width: 150 }}>{getFullName(data?.father)}</Cell>
        <Cell style={{ width: 90 }} bold>
          {getTranslation('pdf.birthNotification.phoneNumber.label', 'Phone number')}
        </Cell>
        <FlexCell>{data?.additionalData?.primaryContactNumber}</FlexCell>
      </Row>
    </Table>
  );
};

const signatureStyles = StyleSheet.create({
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
  },
  rightText: {
    width: 30,
    marginRight: 10,
  },
  line: {
    flex: 1,
    borderBottom: '1 solid black',
  },
});

const SignatureSection = () => {
  const { getTranslation } = useLanguageContext();
  return (
    <View style={signatureStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={signatureStyles.leftCell}>
          <P bold style={signatureStyles.leftText}>
            {getTranslation(
              'pdf.birthNotification.signature.certifiedCorrectBy',
              'Certified correct by',
            )}
            :
          </P>
          <View style={signatureStyles.line} />
        </View>
        <View style={signatureStyles.leftCell}>
          <P bold style={signatureStyles.leftText}>
            {getTranslation(
              'pdf.birthNotification.signature.circleApplicable',
              'Circle applicable',
            )}
            :
          </P>
          <P bold>
            {getTranslation(
              'pdf.birthNotification.signature.doctorMidwifeNurse',
              'Doctor/midwife/nurse',
            )}
          </P>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={signatureStyles.rightCell}>
          <P bold style={signatureStyles.rightText}>
            {getTranslation('pdf.birthNotification.signature.signed', 'Signed') + ':'}
          </P>
          <View style={signatureStyles.line} />
        </View>
        <View style={signatureStyles.rightCell}>
          <P bold style={signatureStyles.rightText}>
            {getTranslation('pdf.birthNotification.signature.date', 'Date')}:
          </P>
          <View style={signatureStyles.line} />
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
  printedBy,
  certificateData,
  getSetting,
}) => {
  const { logo, watermark } = certificateData;
  const { getTranslation } = useLanguageContext();
  const enableFSMStyle = getSetting('fsmCrvsCertificates.enableFSMStyle');

  if (enableFSMStyle) {
    return (
      <FSMBirthNotificationCertificate
        motherData={motherData}
        fatherData={fatherData}
        childData={childData}
        printedBy={printedBy}
      />
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark && <Watermark src={watermark} />}
        <CertificateHeader>
          <LetterheadSection
            logoSrc={logo}
            certificateTitle={getTranslation('pdf.birthNotification.title', 'Birth Notification')}
            letterheadConfig={certificateData}
          />
        </CertificateHeader>
        <TopSection facilityName={facility?.name} childDisplayId={childData?.displayId} />
        <ParentSection
          parentType={getTranslation('general.localisedField.motherId.label', 'Mother')}
          data={motherData}
        />
        <ParentSection
          parentType={getTranslation('general.localisedField.fatherId.label', 'Father')}
          data={fatherData}
        />
        <ChildSection data={childData} />
        <SignatureSection />
        <Footer />
      </Page>
    </Document>
  );
};

export const BirthNotificationCertificate = withLanguageContext(
  withDateTimeContext(BirthNotificationCertificateComponent),
);
