import React from 'react';
import { Document, StyleSheet, View } from '@react-pdf/renderer';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import {
  MARITAL_STATUS_OPTIONS,
  SEX_OPTIONS,
} from '@tamanu/constants';
import { getDisplayDate } from './getDisplayDate';
import { Page } from '../pdf/Page';
import { Text } from '../pdf/Text';

const styles = StyleSheet.create({
  page: {
    padding: 30,
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
    width: 20, // Reduced as it's just for "a.", "b." etc in Part I
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 4,
  },
  partHeader: {
    padding: 4,
    borderBottom: '1 solid black',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  partHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    borderTop: '1 solid #DEDEDE',
  },
  footerText: {
    fontSize: 8,
    color: '#888',
  },
  // Specific for Cause of Death
  causeRow: {
    flexDirection: 'row',
    borderBottom: '1 solid black',
    minHeight: 24,
  },
  causeLabel: {
    width: 30,
    borderRight: '1 solid black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  causeContent: {
    flex: 1,
    padding: 4,
    borderRight: '1 solid black',
  },
  causeInterval: {
    width: 150,
    padding: 4,
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

// Accessor helpers (placeholder logic mostly)
const getCauseText = (cause) => cause?.condition?.name || '';
const getCauseInterval = (cause) => cause?.timeAfterOnset || ''; // Naive format

export const FSMDeathCertificatePrintout = ({
  patientData,
  printedBy,
}) => {
  const currentDateString = getCurrentDateString();

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
            <Cell width={80} label="Sex:" value={getLabelFromValue(SEX_OPTIONS, patientData?.sex)} />
            <Cell width={120} lastCell label="Date of death:" value={patientData?.dateOfDeath ? getDisplayDate(patientData?.dateOfDeath) : ''} />
          </View>

          {/* Row 2: Age Details */}
          <View style={styles.row}>
            <Cell flex={1} label="Age:" value={patientData?.age} />
            <Cell flex={1} label="Under 1 year:" />
            <Cell flex={1} label="Under 1 day:" />
            <Cell flex={1} label="Date of birth:" value={patientData?.dateOfBirth ? getDisplayDate(patientData?.dateOfBirth) : ''} />
            <Cell flex={1} lastCell label="FSM state of death:" />
          </View>

          {/* Row 3: Location of Death */}
          <View style={styles.row}>
            <Cell flex={2} label="Atoll of island group of death:" />
            <Cell flex={2} label="Hospital/Dispensary or village & island municipality:" value={patientData?.facility?.name} />
            <Cell flex={1} lastCell label="Hospital Record No.:" value={patientData?.displayId} />
          </View>

          {/* Row 4: Origin & Status */}
          <View style={styles.row}>
            <Cell flex={1.5} label="State & island of birth or country:" value={patientData?.placeOfBirth} />
            <Cell flex={1.5} label="Country of citizenship:" value={patientData?.nationality?.name} />
            <Cell flex={1} label="Marital status:" value={getLabelFromValue(MARITAL_STATUS_OPTIONS, patientData?.maritalStatus)} />
            <Cell flex={1} lastCell label="Surviving spouse (marital):" />
          </View>

          {/* Row 5: Employment */}
          <View style={styles.row}>
            <Cell flex={1} label="Social security no.:" />
            <Cell flex={1} label="Usual occupation:" value={patientData?.occupation?.name} />
            <Cell flex={1} lastCell label="Kind of Business/Ind.:" />
          </View>

          {/* Row 6: Residence */}
          <View style={styles.row}>
            <Cell flex={1} label="Residence (FSM state):" value={patientData?.address?.state} />
            <Cell flex={1} label="Atoll or Island group:" />
            <Cell flex={1.5} lastCell label="Village or Hamlet, Municipality, Island:" value={patientData?.address?.text} />
          </View>

          {/* Row 7: Parents */}
          <View style={styles.row}>
            <Cell flex={1} label="Father first name:" value={patientData?.father?.firstName} />
            <Cell flex={1} label="Father middle name:" value={patientData?.father?.middleName} />
            <Cell flex={1} label="Father last name:" value={patientData?.father?.lastName} />
            <Cell flex={1} label="Mother first name:" value={patientData?.mother?.firstName} />
            <Cell flex={1} label="Mother middle name:" value={patientData?.mother?.middleName} />
            <Cell flex={1} lastCell label="Mother last name:" value={patientData?.mother?.lastName} />
          </View>

          {/* Row 8: Informant */}
          <View style={styles.row}>
            <Cell flex={1} label="Informant name:" />
            <Cell flex={1} label="Informant relationship:" />
            <Cell flex={1.5} label="Informant address:" />
            <Cell flex={0.8} lastCell label="Date information was given:" />
          </View>

          {/* PART I: Medical Certification */}
          <View style={styles.partHeader}>
            <Text bold style={styles.partHeaderText}>PART I - Death was caused by:</Text>
            <Text bold style={styles.partHeaderText}>Approx. Interval - onset & death:</Text>
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
            <View style={styles.causeContent}>
               <Text style={{ marginBottom: 4 }}>Due to, or as a consequence of:</Text>
               <Text>{getCauseText(patientData?.causes?.antecedent3)}</Text>
            </View>
            <View style={[styles.causeInterval, { borderRight: 0 }]}>
              <Text>{getCauseInterval(patientData?.causes?.antecedent3)}</Text>
            </View>
          </View>

          {/* PART II */}
          <View style={[styles.row, { borderBottom: 0 }]}>
            <View style={[styles.cell, { flex: 3, borderRight: '1 solid black' }]}>
               <Text bold style={styles.label}>PART II - Other significant conditions: Conditions contributing to death, not related to Part I (a):</Text>
               <Text style={styles.value}>
                  {patientData?.causes?.contributing?.map(c => c?.condition?.name).join(', ')}
               </Text>
            </View>
            <Cell flex={1} lastCell label="Autopsy" />
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
            <Cell flex={1} label="Child Bearing Age (15-44):" />
            <Cell flex={1} label="Now pregnant:" />
            <Cell flex={1} label="Number of weeks:" />
            <Cell flex={1.5} label="Death date within 42 days of delivery or abortion" />
            <Cell flex={1} lastCell label="Date of Delivery/Abortion:" />
          </View>

          {/* Physician Cert 1 */}
          <View style={styles.row}>
             <View style={[styles.cell, { flex: 1, borderRight: 0 }]}>
               <Text bold style={styles.label}>I certify that I attended the deceased and that death occurred on the date and at the time my knowledge from the causes shown</Text>
             </View>
          </View>
          <View style={styles.row}>
            <Cell flex={2} label="Name of physician:" />
            <Cell flex={2} label="Signature:" />
            <Cell flex={1} lastCell label="Date signed:" />
          </View>

           {/* Review Cert */}
          <View style={styles.row}>
             <View style={[styles.cell, { flex: 1, borderRight: 0 }]}>
               <Text bold style={styles.label}>Official report and findings of investigation where applicable were reviewed by:</Text>
             </View>
          </View>
          <View style={styles.row}>
            <Cell flex={2} label="Name of physician:" />
            <Cell flex={2} label="Signature:" />
            <Cell flex={1} lastCell label="Date signed:" />
          </View>

          {/* Injury Details */}
          <View style={styles.row}>
            <Cell flex={1.5} label="Accident, suicide, homicide, undetermined (specify):" />
            <Cell flex={1} label="Date of injury:" />
            <Cell flex={2} lastCell label="How injury occurred:" />
          </View>
          <View style={styles.row}>
             <Cell flex={1} label="Injury at work:" />
             <Cell flex={2} label="Place of injury:" />
             <Cell flex={1.5} lastCell label="Location:" />
          </View>

          {/* Administrative Cert */}
          <View style={styles.row}>
             <View style={[styles.cell, { flex: 1, borderRight: 0 }]}>
               <Text bold style={styles.label}>I certify that I have reviewed this Certificate for completeness and accuracy</Text>
             </View>
          </View>
          <View style={styles.row}>
            <Cell flex={2} label="Name of SD/HS or Designee:" />
            <Cell flex={2} label="Signature:" />
            <Cell flex={1} lastCell label="Date signed:" />
          </View>
          <View style={[styles.row, { borderBottom: 0 }]}>
            <Cell flex={2} label="Name of clerk of courts:" />
            <Cell flex={2} label="Signature:" />
            <Cell flex={1} lastCell label="Date signed:" />
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
