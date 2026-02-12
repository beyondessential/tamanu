import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { differenceInYears, differenceInMonths, differenceInDays, differenceInHours } from 'date-fns';
import {
  MARITAL_STATUS_OPTIONS,
  SEX_OPTIONS,
  MANNER_OF_DEATHS,
  PLACE_OF_DEATHS,
  BINARY_UNKNOWN_OPTIONS,
} from '@tamanu/constants';
import { getDisplayDate } from './getDisplayDate';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';

const styles = StyleSheet.create({
  page: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    fontSize: 9,
  },
  table: {
    border: '1 solid black',
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1 solid black',
  },
  lastRow: {
    flexDirection: 'row',
  },
  cell: {
    height: 36,
    borderRight: '1 solid black',
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: 'flex-start',
  },
  lastCell: {
    borderRight: 0,
  },
  label: {
    fontSize: 9,
    marginBottom: 2,
    color: '#333',
  },
  certificateLabel: {
    fontSize: 9,
    color: '#333',
  },
  value: {
    fontSize: 9,
  },
  headerRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  titleBox: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  headerTitle: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionLabel: {
    width: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 4,
  },
  partHeader: {
    borderBottom: '1 solid black',
    flexDirection: 'row',
  },
  partHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 2,
    borderTop: '1 solid #DEDEDE',
  },
  footerText: {
    fontSize: 8,
    color: '#888',
  },
  causeRow: {
    flexDirection: 'row',
    height: 36,
  },
  causeLabel: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  causeContent: {
    flex: 1,
    padding: 4,
    borderRight: '1 solid black',
    borderBottom: '1 solid black',
  },
  causeInterval: {
    width: 190,
    padding: 4,
    borderBottom: '1 solid black',
  },
});

const Cell = ({ label, value = '', style, width, flex, lastCell = false, height }) => (
  <View style={[
    styles.cell, 
    style, 
    width ? { width } : {}, 
    flex ? { flex } : {}, 
    lastCell ? styles.lastCell : {},
    height ? { height } : {}
  ]}>
    {label && <Text bold style={styles.label}>{label}</Text>}
    <Text style={styles.value}>{value || ' '}</Text>
  </View>
);

const getLabelFromValue = (mapping, v) => {
  const entry = mapping.find(e => e.value === v);
  return entry ? entry.label : '';
};

const FSM_DATE_FORMAT = 'MM/dd/yyyy';

// Accessor helpers
const getCauseText = (cause) => cause?.condition?.name || '';
const getCauseInterval = (cause) => cause?.timeAfterOnset || '';

const getAgeAtDeath = (dateOfBirth, dateOfDeath) => {
  if (!dateOfBirth || !dateOfDeath) return '';
  return String(differenceInYears(new Date(dateOfDeath), new Date(dateOfBirth)));
};

const getUnder1Year = (dateOfBirth, dateOfDeath) => {
  if (!dateOfBirth || !dateOfDeath) return '';
  const dob = new Date(dateOfBirth);
  const dod = new Date(dateOfDeath);
  const years = differenceInYears(dod, dob);
  if (years >= 1) return 'n/a';
  const hours = differenceInHours(dod, dob);
  if (hours < 24) return 'n/a';
  const months = differenceInMonths(dod, dob);
  const afterMonths = new Date(dob);
  afterMonths.setMonth(afterMonths.getMonth() + months);
  const days = differenceInDays(dod, afterMonths);
  return `${months}m ${days}d`;
};

const getUnder1Day = (dateOfBirth, dateOfDeath) => {
  if (!dateOfBirth || !dateOfDeath) return '';
  const years = differenceInYears(new Date(dateOfDeath), new Date(dateOfBirth));
  if (years >= 1) return 'N';
  const hours = differenceInHours(new Date(dateOfDeath), new Date(dateOfBirth));
  return hours < 24 ? 'Y' : 'N';
};

const getChildBearingAge = (sex, dateOfBirth, dateOfDeath) => {
  if (!dateOfBirth || !dateOfDeath || sex !== 'female') return 'n/a';
  const age = differenceInYears(new Date(dateOfDeath), new Date(dateOfBirth));
  return (age >= 15 && age <= 44) ? 'Y' : 'n/a';
};

const getMannerOfDeath = ({ manner, mannerOfDeathDescription }) => {
  if (mannerOfDeathDescription) return mannerOfDeathDescription;
  return getLabelFromValue(MANNER_OF_DEATHS, manner);
};

const getFSMDisplayDate = (date) => {
  if (!date) return '';
  return getDisplayDate(date, FSM_DATE_FORMAT);
};

export const FSMDeathCertificatePrintout = ({
  patientData,
  printedBy,
}) => {
  const currentDateString = getCurrentDateString();
  const additionalData = patientData?.additionalData;
  const dob = patientData?.dateOfBirth;
  const dod = patientData?.dateOfDeath;
  const mannerOfDeath = getMannerOfDeath(patientData);

  return (
    <Document>
      {/* Page 1 */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
           <View style={styles.titleBox}>
            <Text bold style={styles.headerTitle}>DEATH CERTIFICATE</Text>
            <Text bold style={styles.headerSubtitle}>FEDERATED STATES OF MICRONESIA</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Row 1: Personal Identification */}
          <View style={styles.row}>
            <Cell flex={1} label="First name:" value={patientData?.firstName} />
            <Cell flex={1} label="Middle name:" value={patientData?.middleName} />
            <Cell flex={1} label="Last name:" value={patientData?.lastName} />
            <Cell width={60} label="Sex:" value={getLabelFromValue(SEX_OPTIONS, patientData?.sex)} />
            <Cell width={140} lastCell label="Date of death:" value={getFSMDisplayDate(dod)} />
          </View>

          {/* Row 2: Age Details */}
          <View style={styles.row}>
            <Cell flex={1} label="Age:" value={getAgeAtDeath(dob, dod)} />
            <Cell flex={1} label="Under 1 year:" value={getUnder1Year(dob, dod)} />
            <Cell flex={1} label="Under 1 day:" value={getUnder1Day(dob, dod)} />
            <Cell flex={1} label="Date of birth:" value={getFSMDisplayDate(dob)} />
            <Cell width={250} lastCell label="FSM state of death:" value="TBD" />
          </View>

          {/* Row 3: Location of Death */}
          <View style={styles.row}>
            <Cell flex={1} label="Atoll of island group of death:" value="TBD" />
            <Cell flex={1} label="Hospital/Dispensary or village & island municipality:" value="TBD" />
            <Cell width={150} lastCell label="Hospital Record No.:" value={patientData?.displayId} />
          </View>

          {/* Row 4: Origin & Status */}
          <View style={styles.row}>
            <Cell flex={1} label="State & island of birth or country:" value={additionalData?.placeOfBirth} />
            <Cell flex={1} label="Country of citizenship:" value={additionalData?.nationality?.name} />
            <Cell width={130} label="Marital status:" value={getLabelFromValue(MARITAL_STATUS_OPTIONS, 'TBD')} />
            <Cell width={210} lastCell label="Surviving spouse (marital):" value="TBD" />
          </View>

          {/* Row 5: Employment */}
          <View style={styles.row}>
            <Cell width={190} label="Social security no.:" value="TBD" />
            <Cell flex={1} label="Usual occupation:" value="TBD" />
            <Cell flex={1} lastCell label="Kind of Business/Ind.:" value="TBD" />
          </View>

          {/* Row 6: Residence */}
          <View style={styles.row}>
            <Cell width={190} label="Residence (FSM state):" value={additionalData?.division?.name} />
            <Cell flex={1} label="Atoll or Island group:" value={additionalData?.subdivision?.name} />
            <Cell flex={1} lastCell label="Village or Hamlet, Municipality, Island:" value={patientData?.village?.name} />
          </View>

          {/* Row 7: Parents */}
          <View style={styles.row}>
            <Cell flex={1} label="Father first name:" value={additionalData?.father?.firstName} />
            <Cell flex={1} label="Father middle name:" value={additionalData?.father?.middleName} />
            <Cell flex={1} label="Father last name:" value={additionalData?.father?.lastName} />
            <Cell flex={1} label="Mother first name:" value={additionalData?.mother?.firstName} />
            <Cell flex={1} label="Mother middle name:" value={additionalData?.mother?.middleName} />
            <Cell width={140} lastCell label="Mother last name:" value={additionalData?.mother?.lastName} />
          </View>

          {/* Row 8: Informant */}
          <View style={styles.row}>
            <Cell width={160} label="Informant name:" value="TBD" />
            <Cell width={160} label="Informant relationship:" value="TBD" />
            <Cell flex={1} label="Informant address:" value="TBD" />
            <Cell width={140} lastCell label="Date information was given:" value="TBD" />
          </View>

          {/* PART I: Medical Certification */}
          <View style={styles.partHeader}>
            <View style={{ flex: 1, borderRight: '1 solid black', padding: 4 }}>
              <Text bold style={styles.partHeaderText}>PART I - Death was caused by:</Text>
            </View>
            <View style={{ width: 190, padding: 4 }}>
              <Text bold style={styles.partHeaderText}>Approx. Interval - onset & death:</Text>
            </View>
          </View>
          
          {/* Cause rows */}
          {/* a */}
          <View style={styles.causeRow}>
            <View style={styles.causeLabel}><Text>a.</Text></View>
            <View style={styles.causeContent}>
              <Text>{getCauseText(patientData?.causes?.primary)}</Text>
            </View>
            <View style={[styles.causeInterval, { borderRight: 0 }]}>
              <Text>{getCauseInterval(patientData?.causes?.primary)}</Text>
            </View>
          </View>
          {/* b */}
          <View style={styles.causeRow}>
            <View style={styles.causeLabel}><Text>b.</Text></View>
            <View style={styles.causeContent}>
              <Text style={{ marginBottom: 4 }}>Due to, or as a consequence of:</Text>
              <Text>{getCauseText(patientData?.causes?.antecedent1)}</Text>
            </View>
            <View style={[styles.causeInterval, { borderRight: 0 }]}>
              <Text>{getCauseInterval(patientData?.causes?.antecedent1)}</Text>
            </View>
          </View>
          {/* c */}
          <View style={styles.causeRow}>
            <View style={styles.causeLabel}><Text>c.</Text></View>
            <View style={styles.causeContent}>
               <Text style={{ marginBottom: 4 }}>Due to, or as a consequence of:</Text>
               <Text>{getCauseText(patientData?.causes?.antecedent2)}</Text>
            </View>
            <View style={[styles.causeInterval, { borderRight: 0 }]}>
              <Text>{getCauseInterval(patientData?.causes?.antecedent2)}</Text>
            </View>
          </View>
           {/* d */}
          <View style={styles.causeRow}>
            <View style={styles.causeLabel}><Text>d.</Text></View>
            <View style={[styles.causeContent, { borderBottom: 0 }]}>
               <Text style={{ marginBottom: 4 }}>Due to, or as a consequence of:</Text>
               <Text>{getCauseText(patientData?.causes?.antecedent3)}</Text>
            </View>
            <View style={[styles.causeInterval, { borderRight: 0, borderBottom: 0 }]}>
              <Text>{getCauseInterval(patientData?.causes?.antecedent3)}</Text>
            </View>
          </View>

          {/* PART II */}
          <View style={[styles.row, { borderTop: '1 solid black', borderBottom: 0 }]}>
            <View style={[styles.cell, { flex: 1, borderRight: '1 solid black' }]}>
               <Text bold style={styles.label}>PART II - Other significant conditions: Conditions contributing to death, not related to Part I (a):</Text>
               <Text style={styles.value}>
                  {patientData?.causes?.contributing?.map(c => c?.condition?.name).join(', ')}
               </Text>
            </View>
            <Cell width={190} lastCell label="Autopsy" value={getLabelFromValue(BINARY_UNKNOWN_OPTIONS, patientData?.autopsyRequested)} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.lastRow}>
            <Text bold style={styles.footerText}>Print date: </Text>
            <Text style={styles.footerText}>{currentDateString} | </Text>
            <Text bold style={styles.footerText}>Printed by: </Text>
            <Text style={styles.footerText}>{printedBy}</Text>
          </View>
          <View style={styles.lastRow}>
            <Text style={styles.footerText}>1 of 2</Text>
          </View>
        </View>
      </Page>

      {/* Page 2 */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
           <View style={styles.titleBox}>
            <Text bold style={styles.headerTitle}>DEATH CERTIFICATE</Text>
            <Text bold style={styles.headerSubtitle}>FEDERATED STATES OF MICRONESIA</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Row 1: Maternal Details */}
          <View style={styles.row}>
            <Cell flex={1} label="Child Bearing Age (15-44):" value={getChildBearingAge(patientData?.sex, dob, dod)} />
            <Cell flex={1} label="Now pregnant:" value="TBD" />
            <Cell flex={1} label="Number of weeks:" value="TBD" />
            <Cell width={220} label="Death date within 42 days of delivery or abortion" value="TBD" />
            <Cell width={140} lastCell label="Date of Delivery/Abortion:" value="TBD" />
          </View>

          {/* Physician Cert 1 */}
          <View style={styles.row}>
             <View style={{ flex: 1, padding: 4, borderRight: 0 }}>
               <Text bold style={styles.certificateLabel}>I certify that I attended the deceased and that death occurred on the date and at the time my knowledge from the causes shown</Text>
             </View>
          </View>
          <View style={styles.row}>
            <Cell flex={1} label="Name of physician:" value="TBD" />
            <Cell flex={1} label="Signature:" />
            <Cell width={140} lastCell label="Date signed:" />
          </View>

           {/* Review Cert */}
          <View style={styles.row}>
             <View style={{ flex: 1, padding: 4, borderRight: 0 }}>
               <Text bold style={styles.certificateLabel}>Official report and findings of investigation where applicable were reviewed by:</Text>
             </View>
          </View>
          <View style={styles.row}>
            <Cell flex={1} label="Name of physician:" value="TBD" />
            <Cell flex={1} label="Signature:" />
            <Cell width={140} lastCell label="Date signed:" />
          </View>

          {/* Injury Details */}
          <View style={styles.row}>
            <Cell flex={1} label="Accident, suicide, homicide, undetermined (specify):" value={mannerOfDeath} />
            <Cell width={150} label="Date of injury:" value={getFSMDisplayDate(patientData?.externalCauseDate)} />
            <Cell flex={1} lastCell label="How injury occurred:" value={mannerOfDeath} />
          </View>
          <View style={styles.row}>
             <Cell width={100} label="Injury at work:" value="TBD" />
             <Cell flex={1} label="Place of injury:" value={getLabelFromValue(PLACE_OF_DEATHS, patientData?.mannerOfDeathLocation)} />
             <Cell flex={1} lastCell label="Location:" value="TBD" />
          </View>

          {/* Administrative Cert */}
          <View style={styles.row}>
             <View style={{ flex: 1, padding: 4, borderRight: 0 }}>
               <Text bold style={styles.certificateLabel}>I certify that I have reviewed this Certificate for completeness and accuracy</Text>
             </View>
          </View>
          <View style={styles.row}>
            <Cell flex={1} label="Name of SD/HS or Designee:" />
            <Cell flex={1} label="Signature:" />
            <Cell width={140} lastCell label="Date signed:" />
          </View>
          <View style={[styles.row, { borderBottom: 0 }]}>
            <Cell flex={1} label="Name of clerk of courts:" />
            <Cell flex={1} label="Signature:" />
            <Cell width={140} lastCell label="Date signed:" />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.lastRow}>
            <Text bold style={styles.footerText}>Print date: </Text>
            <Text style={styles.footerText}>{currentDateString} | </Text>
            <Text bold style={styles.footerText}>Printed by: </Text>
            <Text style={styles.footerText}>{printedBy}</Text>
          </View>
          <View style={styles.lastRow}>
             <Text style={styles.footerText}>2 of 2</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
